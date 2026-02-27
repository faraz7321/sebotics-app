import { WS_BASE_URL } from "../config";

type MessageHandler = (data: unknown) => void;

export class StateSocket {
  private socket: WebSocket | null = null;
  private baseUrl = WS_BASE_URL;

  private subscribeAction: string;
  private unsubscribeAction: string;
  private onMessage: MessageHandler;

  private subscriptions = new Set<string>();
  private isConnecting = false;

  constructor(
    subscribeAction: string,
    unsubscribeAction: string,
    onMessage: MessageHandler
  ) {
    this.subscribeAction = subscribeAction;
    this.unsubscribeAction = unsubscribeAction;
    this.onMessage = onMessage;
  }

  connect() {
    if (this.socket || this.isConnecting) return;

    this.isConnecting = true;
    this.socket = new WebSocket(this.baseUrl);

    this.socket.onopen = () => {
      this.isConnecting = false;

      // re-subscribe to all robots after reconnect
      this.subscriptions.forEach((robotId) => {
        this.send({
          action: this.subscribeAction,
          robotId
        });
      });
    };

    this.socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.onMessage(data);
      } catch {
        console.error("Invalid JSON:", e.data);
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
      this.isConnecting = false;
    };
  }

  subscribe(robotId: string) {
    this.subscriptions.add(robotId);

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.send({
        action: this.subscribeAction,
        robotId
      });
    }
  }

  unsubscribe(robotId: string) {
    if (!this.subscriptions.has(robotId)) return;

    this.subscriptions.delete(robotId);

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.send({
        action: this.unsubscribeAction,
        robotId
      });
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach((robotId) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({
          action: this.unsubscribeAction,
          robotId
        });
      }
    });

    this.subscriptions.clear();
  }

  disconnect() {
    if (!this.socket) return;

    this.unsubscribeAll();
    this.socket.close();
    this.socket = null;
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private send(data: unknown) {
    this.socket?.send(JSON.stringify(data));
  }
}