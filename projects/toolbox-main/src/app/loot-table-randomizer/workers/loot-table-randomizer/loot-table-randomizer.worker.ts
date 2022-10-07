import { expose } from "comlink";
import { strFromU8, unzip } from 'fflate';
import { LootTableFile } from '../../../../lib/ts-datapack-extensions/loot_table_file';
import { DatapackSerializer } from '../../../../lib/ts-datapack-fflate/datapack-serializer';
import { Datapack } from '../../../../lib/ts-datapack/datapack';
import { PackFormat } from '../../../../lib/ts-datapack/enums/packformat';
import { GenericAdvancement } from '../../../../lib/ts-datapack/generic-advancement';
import { GenericFile } from '../../../../lib/ts-datapack/genericfile';
import { IFile } from '../../../../lib/ts-datapack/interfaces/file';
import { IFolder } from '../../../../lib/ts-datapack/interfaces/folder';
import { ILootTable } from '../../../../lib/ts-datapack/interfaces/loot_table/loot_table';
import { addMainDatapackAdvancement, filenameWithoutExtension, seededRandom, shuffle } from '../../../../lib/utils';

export class LootTableRandomizerWorker {
	private _dataPackData = {
		packFormat: PackFormat.Invalid,
		packPng: <IFile | undefined>undefined,
		loadedLootTables: <{ [key: string]: ILootTable }>{}
	}

	private _defaultLootTableFilePaths!: string[];
	private _shuffledLootTableFilePaths!: string[];

	private _intermediaryDatapack!: Datapack;
	private _finalDatapack!: Datapack;

	public async loadDatapackData(data: Uint8Array) {
		return new Promise<void>((res, rej) => {
			unzip(data, (err, result) => {
				function flatten(obj: any, prefix: string, separator: string, dict: any) {
					for (const key in obj) {
						let newKey: string;
						if (prefix != '') {
							newKey = prefix + separator + key;
						} else {
							newKey = key;
						}

						if (!key.endsWith(".json") && typeof obj[key] === 'object') {
							flatten(obj[key], newKey, separator, dict);
						} else {
							dict[newKey] = obj[key];
						}
					}
				}

				if (err) {
					rej(err);
					return;
				}

				this._dataPackData.packFormat = JSON.parse(strFromU8(result["info.json"])).packFormat;
				this._dataPackData.packPng = new GenericFile("pack.png", "binary", result["pack.png"]);


				let flattenedLootTables: { [key: string]: ILootTable } = {};
				flatten(JSON.parse(strFromU8(result["loot_tables.json"])), "", "/", flattenedLootTables);
				this._dataPackData.loadedLootTables = flattenedLootTables;

				res();
			});
		});
	}

	public async prepareDataPack(seed: number, selectedLootTables: string[]) {
		this._intermediaryDatapack = new Datapack();
		this._finalDatapack = new Datapack();

		this._finalDatapack.name = `random_loot_${seed}`;
		this._finalDatapack['pack.mcmeta'].description = `Loot-Table Randomizer\nSeed: ${seed}`;
		this._finalDatapack['pack.mcmeta'].packFormat = this._dataPackData.packFormat;
		this._finalDatapack.set(this._dataPackData.packPng);

		for (const [key, value] of Object.entries(this._dataPackData.loadedLootTables)) {
			let lootTableFile = new LootTableFile(key, value);
			this._intermediaryDatapack.set(lootTableFile);
		}

		let allLootTablePaths = this._intermediaryDatapack.allFilePaths
			.filter(x => x.startsWith("data/minecraft/loot_tables/"));

		let removedLootTables = allLootTablePaths
			.filter(x => !selectedLootTables.includes(x));

		for (const lootTablePath of removedLootTables) {
			let lootTableFolder = lootTablePath.substring(0, lootTablePath.lastIndexOf("/"));
			let filename = lootTablePath.substring(lootTablePath.lastIndexOf("/") + 1);
			this._intermediaryDatapack.get<IFolder>(lootTableFolder)?.delete(filename);
		}

		addMainDatapackAdvancement(this._finalDatapack);

		let advancement = new GenericAdvancement("data/fasguys_toolbox/advancements/loot_table_randomizer/main.json");
		advancement.setValues({
			display: {
				icon: {
					item: "minecraft:blaze_powder"
				},
				title: "Loot-Table Randomizer",
				frame: "challenge",
				description: "",
				show_toast: false,
				announce_to_chat: false
			},
			parent: "fasguys_toolbox:root",
			criteria: {
				tick: {
					trigger: "minecraft:tick"
				}
			}
		});
		this._finalDatapack.set(advancement);

		this._defaultLootTableFilePaths = this._intermediaryDatapack.allFilePaths.filter(x => x.startsWith("data/minecraft/loot_tables/"));
		this._shuffledLootTableFilePaths = shuffle([...this._defaultLootTableFilePaths], seededRandom(seed));
	}

	public async generateCheatsheet() {
		let cheatsheet = "";
		for (let i = 0; i < this._defaultLootTableFilePaths.length; i++) {
			cheatsheet += `${filenameWithoutExtension(this._defaultLootTableFilePaths[i])} drops from ${filenameWithoutExtension(this._shuffledLootTableFilePaths[i])}\n`;
		}

		this._finalDatapack.set(new GenericFile("cheatsheet.txt", "string", cheatsheet));
	}

	public async shuffleLootTables() {
		for (let i = 0; i < this._defaultLootTableFilePaths.length; i++) {
			let originalFile = this._intermediaryDatapack.get<LootTableFile>(this._defaultLootTableFilePaths[i])!;

			//The file gets cloned, so we can make changes to the file without affecting the original file.
			let clone = originalFile.clone();
			clone.name = this._shuffledLootTableFilePaths[i];

			this._finalDatapack.set(clone);
		}
	}

	public async removeConditions() {
		for (let i = 0; i < this._defaultLootTableFilePaths.length; i++) {
			let originalFile = this._finalDatapack.get<LootTableFile>(this._defaultLootTableFilePaths[i])!;

			let conditions = [
				...originalFile.getConditions("minecraft:killed_by_player"),
				...originalFile.getConditions("minecraft:block_state_property"),
			]

			for (const condition of conditions) {
				condition.remove();
			}
		}
	}

	public async manipulateDropChances() {
		for (let i = 0; i < this._defaultLootTableFilePaths.length; i++) {
			let originalFile = this._finalDatapack.get<LootTableFile>(this._defaultLootTableFilePaths[i])!;

			let functions = originalFile.getFunctions("minecraft:set_count");

			for (const functionKit of functions) {
				//TODO: This check is completely redundant and only here because of TypeScript.
				//There is probably a way to make it, so getFunctions directly returns with the proper requested type.
				if (functionKit.data.function !== "minecraft:set_count") continue;

				if (typeof functionKit.data.count === "number") {
					//If it's already just a number, then there is no variance. Skip.
					continue;
				}

				switch (functionKit.data.count.type) {
					case "minecraft:constant":
						functionKit.data.count = functionKit.data.count.value;
						break;
					case "minecraft:uniform":
						functionKit.data.count = functionKit.data.count.max;
						break;
					case "minecraft:binomial":
						functionKit.data.count = functionKit.data.count.n;
						break;
					case "minecraft:score":
						functionKit.remove();
						break;
				}
			}
		}
	}

	public async finalize() {
		return {
			href: URL.createObjectURL(await DatapackSerializer.packUp(this._finalDatapack)),
			filename: this._finalDatapack.name
		}
	}
}

expose(LootTableRandomizerWorker);