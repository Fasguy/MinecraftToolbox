// @ts-nocheck

import { ITool } from "src/app/common/interfaces/tool";
import { PresetWarningComponent } from "src/app/common/views/windows/preset-warning/preset-warning.component";
import { deserialize, serialize } from "src/lib/serialize-form";
import { Datapack } from "./ts-datapack/datapack";
import { GenericAdvancement } from "./ts-datapack/generic-advancement";

export const MAX_SIGNED_64_BIT_INTEGER = 9223372036854775807n;

export function duckCheck(obj: any, ...properties: any[]) {
	for (const property of properties) {
		if (typeof obj[property] === "undefined") {
			return false;
		}
	}

	return true;
}

export function seededRandom(seed: BigInt) {
	const baseSeeds = [101182939n, 495868718n, 999091121n, 39475253n];

	let [x, y, z, w] = baseSeeds;

	const random = () => {
		const t = (x ^ (x << BigInt(11))) % MAX_SIGNED_64_BIT_INTEGER;
		[x, y, z] = [y, z, w];
		w = (((w ^ (w >> BigInt(19))) % MAX_SIGNED_64_BIT_INTEGER) ^ ((t ^ (t >> BigInt(8))) % MAX_SIGNED_64_BIT_INTEGER)) % MAX_SIGNED_64_BIT_INTEGER;
		return Number(w * 100n / MAX_SIGNED_64_BIT_INTEGER) / 100;
	};

	[x, y, z, w] = baseSeeds.map(i => i + seed);
	[x, y, z, w] = [0, 0, 0, 0].map(() => BigInt(Math.round(random() * 1e16)));

	return random;
}

export function sleep(ms: number) {
	return new Promise<void>(x => setTimeout(x, ms));
}

export function randomRange(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function trimStart(str: string, text: string) {
	while (str.startsWith(text)) {
		str = str.slice(0, text.length);
	}

	return str;
}

export function trimEnd(str: string, text: string) {
	while (str.endsWith(text)) {
		str = str.slice(0, -text.length);
	}

	return str;
}

export function shuffle<T>(array: T[], random = Math.random) {
	//Preventing a potential infinite loop
	if (array.length < 2) return array;

	for (let i = array.length - 1; i > 0; i--) {
		let j;

		//If the indexes are colliding, then we need to generate a new number.
		do {
			j = Math.floor(random() * (i + 1));
		}
		while (j === i);

		[array[i], array[j]] = [array[j], array[i]];
	}

	return array;
}

export function tryParseBigInt(str: string) {
	try {
		return {
			success: true,
			value: BigInt(str)
		};
	}
	catch {
		return {
			success: false,
			value: BigInt(NaN)
		};
	}
}

export function hashCode(input: string) {
	if (input.length === 0) return 0;

	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		let unicodeIndex = input.charCodeAt(i);
		hash = ((hash << 5) - hash) + unicodeIndex;
		hash |= 0; // Convert to 32bit integer
	}

	return hash;
};

export function addMainDatapackAdvancement(datapack: Datapack) {
	let advancement = new GenericAdvancement("data/fasguys_toolbox/advancements/root.json");
	advancement.setValues({
		display: {
			icon: {
				item: "minecraft:chest"
			},
			title: "Fasguy's Minecraft Toolbox",
			frame: "task",
			background: "minecraft:textures/block/stone.png",
			description: "All currently installed Toolbox datapacks",
			show_toast: false,
			announce_to_chat: false
		},
		criteria: {
			tick: {
				trigger: "minecraft:tick"
			}
		}
	});
	datapack.set(advancement);
}

//structedClone is not supported well enough (and slow)
//JSON stringify/parse is slower than just recursively cloning the object
export function deepCopy(o: any): any {
	// if not array or object or is null return self
	if (typeof o !== "object" || o === null) return o;
	let newO: any, i;
	// handle case: array
	if (o instanceof Array) {
		let l;
		newO = [];
		for (i = 0, l = o.length; i < l; i++) newO[i] = deepCopy(o[i]);
		return newO;
	}
	// handle case: object
	newO = {};
	for (i in o) if (o.hasOwnProperty(i)) newO[i] = deepCopy(o[i]);
	return newO;
}

export function filenameWithoutExtension(path: string) {
	let folderIndex = path.lastIndexOf("/") + 1;
	if (folderIndex > 0) {
		path = path.substring(folderIndex);
	}
	let extensionIndex = path.lastIndexOf(".");
	if (extensionIndex > 0) {
		path = path.substring(0, extensionIndex);
	}
	return path;
}

export function spreadOrEmpty<T>(array?: T[]) {
	return [...(array ?? [])];
}

export function mapFormData(form: HTMLFormElement) {
	let formData = new FormData(form);
	let formDataMap: any = {};

	let keys = new Set<string>([...formData].map(x => x[0]));
	for (const key of keys) {
		formDataMap[key] = formData.getAll(key);
		if (formDataMap[key].length === 1) {
			formDataMap[key] = formDataMap[key][0];
		}
	}

	return formDataMap;
}

export function download(name: string, href: string) {
	let a = document.createElement("a");
	a.download = name;
	a.href = href;
	a.click();
}

export function exportSettings(this: ITool, form: HTMLFormElement) {
	let serializedForm = serialize(form);

	let fullPreset = {
		tool: this.tool,
		version: this.version,
		data: serializedForm
	};

	let presetString = JSON.stringify(fullPreset);
	let presetBlob = new Blob([presetString], { type: "application/json" });
	let presetUrl = URL.createObjectURL(presetBlob);

	download(`${this.tool}-preset.json`, presetUrl);

	URL.revokeObjectURL(presetUrl);
}

export async function importSettings(this: ITool, form: HTMLFormElement) {
	let fileInput = document.createElement("input");
	fileInput.type = "file";
	fileInput.accept = "application/json";
	fileInput.addEventListener("change", (e) => {
		let file = (<HTMLInputElement>e.target).files![0];

		if (file) {
			let reader = new FileReader();

			reader.addEventListener("load", (e) => {
				let preset = JSON.parse(<string>reader.result);

				if (preset.tool !== this.tool) {
					let warningWindow = this.window.createWindow(PresetWarningComponent);
					warningWindow.instance.title = "Failed to load preset";
					warningWindow.instance.text = `This preset was created for a different tool and could therefore not be loaded here.

						This preset was created for the tool "${preset.tool}".`;
					return;
				}

				if (preset.version !== this.version) {
					let warningWindow = this.window.createWindow(PresetWarningComponent);
					warningWindow.instance.title = "Version mismatch";
					warningWindow.instance.text = `This preset was created for Minecraft version ${preset.version}.

						The preset has been loaded, but the selected settings may not work as expected.

						Please double-check your settings.`;
				}

				deserialize(form, preset.data);
			});

			reader.readAsText(file);
		}
	});

	fileInput.click();
}

export function randomMinecraftSeed() {
	let baseNumber = [...Array(19)].map(_ => Math.random() * 10 | 0).join("");
	return `${Math.random() < 0.5 ? "-" : ""}${baseNumber}`;
}

export function isObject(item: any) {
	return (item && typeof item === 'object' && !Array.isArray(item));
}

//https://stackoverflow.com/a/34749873
export function mergeDeep(target: any, ...sources: any): any {
	if (!sources.length) return target;
	const source = sources.shift();

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				mergeDeep(target[key], source[key]);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		}
	}

	return mergeDeep(target, ...sources);
}

export function seedHelper(submittedSeed: string) {
	let parsedSeed = tryParseBigInt(submittedSeed);
	let seed: bigint;

	if (parsedSeed.success && parsedSeed.value !== 0) {
		seed = parsedSeed.value;
	} else {
		seed = hashCode(submittedSeed);
	}

	if (seed === 0) {
		seed = BigInt(randomMinecraftSeed());
	}

	return seed;
}