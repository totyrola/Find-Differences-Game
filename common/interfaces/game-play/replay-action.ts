export interface ReplayAction {
    time: number; // in seconds
    action: () => void;
}
