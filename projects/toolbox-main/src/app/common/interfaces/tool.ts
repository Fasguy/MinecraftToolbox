import { WindowService } from "../services/window-service/window.service";

export interface ITool {
	readonly version: string;
	readonly tool: string;
	readonly window: WindowService;
}