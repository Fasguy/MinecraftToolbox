import { IAdvancement } from "./interfaces/advancement";
import { IFile } from "./interfaces/file";
import { ISerializable } from "./interfaces/serializable";

export class GenericAdvancement implements IFile, IAdvancement, ISerializable {
	public name: string;

	public display?: {
		icon: {
			item: string;
			nbt?: string | undefined;
		};
		title: string | string[];
		frame: "challenge" | "goal" | "task";
		background?: string | undefined;
		description: string | string[];
		show_toast: boolean;
		announce_to_chat: boolean;
		hidden: boolean;
	} | undefined;

	public parent?: string | undefined;

	public criteria!: {
		[criterionName: string]: {
			trigger: string;
			conditions?: any;
		};
	};

	public requirements?: string[][] | undefined;

	public rewards?: {
		recipes?: string[] | undefined;
		loot?: string[] | undefined;
		experience?: number | undefined;
		function?: string | undefined;
	} | undefined;

	public constructor(name: string) {
		this.name = name;
	}

	public setValues(values: Partial<IAdvancement>): void {
		Object.assign(this, values);
	}

	public serialize(): string {
		return JSON.stringify({
			display: this.display,
			parent: this.parent,
			criteria: this.criteria,
			requirements: this.requirements,
			rewards: this.rewards
		});
	}
}