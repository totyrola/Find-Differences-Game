export interface Message {
    text: string;
    time: string;
    isMessageText: boolean;
    messageReceived: boolean;
    name?: string;
}
