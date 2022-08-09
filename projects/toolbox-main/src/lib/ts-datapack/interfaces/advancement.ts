import { IRawJSONText } from "./rawjsontext";

export type IAdvancement = {
	display?: {
		icon: {
			item: string;
			nbt?: string;
		};
		title: IRawJSONText | string[];
		frame: "challenge" | "goal" | "task"; //Default: "task"
		background?: string;
		description: IRawJSONText | string[];
		show_toast?: boolean; //Default: true
		announce_to_chat?: boolean; //Default: true
		hidden?: boolean; //Default: false
	};
	parent?: string;
	criteria: {
		[criterionName: string]: {
			trigger: string;
			conditions?: any;
		}
	};
	requirements?: string[][];
	rewards?: {
		recipes?: string[];
		loot?: string[];
		experience?: number;
		function?: string;
	};
}