const { Socket } = require('phoenix');
const WebSocket = require('ws');

const BAND_REST_URL = process.env.BAND_REST_URL || 'https://app.band.ai/api/v1/agent';
const BAND_WS_URL = process.env.BAND_WS_URL || 'wss://app.band.ai/api/v1/socket/websocket';

class BandClient {
    constructor(agentId, apiKey, agentName) {
        this.agentId = agentId;
        this.apiKey = apiKey;
        this.agentName = agentName;
        this.socket = null;
        this.channels = new Map();
        this.messageHandlers = [];
        this.connectPromise = null;
    }

    connect() {
        if (this.connectPromise) return this.connectPromise;
        if (!this.agentId || !this.apiKey) {
            return Promise.reject(new Error(`Missing Band credentials for ${this.agentName}.`));
        }

        this.connectPromise = new Promise((resolve, reject) => {
            const url = `${BAND_WS_URL}?api_key=${encodeURIComponent(this.apiKey)}&vsn=2.0.0`;
            this.socket = new Socket(url, {
                transport: WebSocket,
                heartbeatIntervalMs: 30000,
                reconnectAfterMs: (tries) => Math.min(tries * 1000, 10000)
            });

            const timeout = setTimeout(() => reject(new Error(`Band WebSocket timeout for ${this.agentName}.`)), 15000);
            this.socket.onOpen(async () => {
                clearTimeout(timeout);
                console.log(`[BandClient:${this.agentName}] connected`);
                try {
                    await this.joinChannel(`agent_rooms:${this.agentId}`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
            this.socket.onError((error) => console.error(`[BandClient:${this.agentName}] socket error`, error));
            this.socket.onClose(() => console.log(`[BandClient:${this.agentName}] disconnected`));
            this.socket.connect();
        });

        return this.connectPromise;
    }

    onMessage(callback) {
        this.messageHandlers.push(callback);
    }

    joinChannel(topic) {
        if (this.channels.has(topic)) return Promise.resolve(this.channels.get(topic));
        if (!this.socket) return Promise.reject(new Error(`Band socket is not connected for ${this.agentName}.`));

        return new Promise((resolve, reject) => {
            const channel = this.socket.channel(topic, {});

            if (topic.startsWith('chat_room:')) {
                channel.on('message_created', (payload) => {
                    const message = payload.message || payload;
                    const senderId = message.sender?.id || message.sender_id || message.agent_id;
                    if (!message || senderId === this.agentId) return;
                    const enriched = { ...payload, message, room_id: topic.replace('chat_room:', '') };
                    for (const handler of this.messageHandlers) {
                        Promise.resolve(handler(enriched)).catch((error) => {
                            console.error(`[BandClient:${this.agentName}] message handler failed`, error);
                        });
                    }
                });
            }

            if (topic.startsWith('agent_rooms:')) {
                channel.on('room_added', (payload) => {
                    const roomId = payload.chat_id || payload.id || payload.room?.id || payload.chat?.id;
                    if (roomId) {
                        this.joinChannel(`chat_room:${roomId}`).catch((error) => {
                            console.error(`[BandClient:${this.agentName}] failed to join room ${roomId}`, error);
                        });
                    }
                });
            }

            channel.join()
                .receive('ok', () => {
                    this.channels.set(topic, channel);
                    console.log(`[BandClient:${this.agentName}] joined ${topic}`);
                    resolve(channel);
                })
                .receive('error', (response) => reject(new Error(`Failed to join ${topic}: ${JSON.stringify(response)}`)))
                .receive('timeout', () => reject(new Error(`Timed out joining ${topic}.`)));
        });
    }

    async restCall(endpoint, method = 'GET', body) {
        const response = await fetch(`${BAND_REST_URL}${endpoint}`, {
            method,
            headers: {
                'X-API-Key': this.apiKey,
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        });

        if (response.status === 204) return null;
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(`Band API ${response.status}: ${JSON.stringify(data)}`);
        }
        return data;
    }

    markProcessing(roomId, messageId) {
        return this.restCall(`/chats/${roomId}/messages/${messageId}/processing`, 'POST');
    }

    markProcessed(roomId, messageId) {
        return this.restCall(`/chats/${roomId}/messages/${messageId}/processed`, 'POST');
    }

    sendMessage(roomId, content, mentions = []) {
        return this.restCall(`/chats/${roomId}/messages`, 'POST', {
            message: {
                content,
                mentions: mentions.map(({ id }) => ({ id }))
            }
        });
    }

    sendEvent(roomId, type, content) {
        return this.restCall(`/chats/${roomId}/events`, 'POST', {
            event: { content, message_type: type }
        });
    }

    createRoom(taskId) {
        return this.restCall('/chats', 'POST', {
            chat: taskId ? { task_id: taskId } : {}
        });
    }

    addParticipant(roomId, participantId) {
        return this.restCall(`/chats/${roomId}/participants`, 'POST', {
            chat_participant: { agent_id: participantId }
        });
    }
}

module.exports = { BandClient };
