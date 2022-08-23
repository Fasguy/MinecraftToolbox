import { Injectable } from '@angular/core';
import { ActivityMonitorService } from 'src/app/common/services/activity-monitor/activity-monitor.service';
import { LootTableFile } from 'src/lib/ts-datapack-extensions/loot_table_file';
import { DatapackSerializer } from 'src/lib/ts-datapack-fflate/datapack-serializer';
import { Datapack } from 'src/lib/ts-datapack/datapack';
import { PackFormat } from 'src/lib/ts-datapack/enums/packformat';
import { GenericAdvancement } from 'src/lib/ts-datapack/generic-advancement';
import { GenericFile } from 'src/lib/ts-datapack/genericfile';
import { IFile } from 'src/lib/ts-datapack/interfaces/file';
import { IFolder } from 'src/lib/ts-datapack/interfaces/folder';
import { ILootTable } from 'src/lib/ts-datapack/interfaces/loot_table/loot_table';
import { addMainDatapackAdvancement, filenameWithoutExtension, seededRandom, shuffle, sleep } from 'src/lib/utils';

@Injectable()
export class LootTableRandomizerService {
	private _loadedLootTables: { [key: string]: ILootTable } = {};

	public dataPackInfo: DataPackInformation = {
		packFormat: PackFormat.Invalid
	};

	public selectedLootTables: string[] = [];

	public otherOptions = {
		dropChance100: false
	};

	public set loadedLootTables(lootTables: any) {
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

		let flattenedLootTables: { [key: string]: ILootTable } = {};
		flatten(lootTables, "", "/", flattenedLootTables);
		this._loadedLootTables = flattenedLootTables;
	}

	constructor(
		private _activityMonitor: ActivityMonitorService
	) {
	}

	private prepareDatapacks() {
		let intermediaryDatapack = new Datapack();

		for (const [key, value] of Object.entries(this._loadedLootTables)) {
			let lootTableFile = new LootTableFile(key, value);
			intermediaryDatapack.set(lootTableFile);
		}

		let allLootTablePaths = intermediaryDatapack.allFilePaths
			.filter(x => x.startsWith("data/minecraft/loot_tables/"));

		let removedLootTables = allLootTablePaths
			.filter(x => !this.selectedLootTables.includes(x));

		for (const lootTablePath of removedLootTables) {
			let lootTableFolder = lootTablePath.substring(0, lootTablePath.lastIndexOf("/"));
			let filename = lootTablePath.substring(lootTablePath.lastIndexOf("/") + 1);
			intermediaryDatapack.get<IFolder>(lootTableFolder)?.delete(filename);
		}

		let finalDatapack = new Datapack();

		addMainDatapackAdvancement(finalDatapack);

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
		finalDatapack.set(advancement);

		finalDatapack['pack.mcmeta'].packFormat = this.dataPackInfo.packFormat;
		finalDatapack.set(this.dataPackInfo.packPng);

		return { intermediaryDatapack, finalDatapack };
	}

	public async randomize(seed: number) {
		let { intermediaryDatapack, finalDatapack } = this.prepareDatapacks();

		await this._activityMonitor.startActivity({
			text: "Preparing the data pack...",
			promise: (async () => {
				finalDatapack.name = `random_loot_${seed}`;
				finalDatapack['pack.mcmeta'].description = `Loot-Table Randomizer\nSeed: ${seed}`;
			})()
		});

		let lootTables = intermediaryDatapack.allFilePaths.filter(x => x.startsWith("data/minecraft/loot_tables/"));
		let shuffledLootTables = shuffle([...lootTables], seededRandom(seed));

		await this._activityMonitor.startActivity({
			text: "Generating cheatsheet...",
			promise: (async () => {
				let cheatsheet = "";
				for (let i = 0; i < lootTables.length; i++) {
					cheatsheet += `${filenameWithoutExtension(lootTables[i])} drops from ${filenameWithoutExtension(shuffledLootTables[i])}\n`;
				}

				finalDatapack.set(new GenericFile("cheatsheet.txt", "string", cheatsheet));
			})()
		});

		await this._activityMonitor.startActivity({
			text: "Shuffling loot tables...",
			promise: (async () => {
				for (let i = 0; i < lootTables.length; i++) {
					if (i % 100 === 0) {
						//Perform a small UI-update every 100 files.
						await sleep(0);
					}

					let originalFile = intermediaryDatapack.get<LootTableFile>(lootTables[i])!;

					//The file gets cloned, so we can make changes to the file without affecting the original file.
					let clone = originalFile.clone();
					clone.name = shuffledLootTables[i];

					finalDatapack.set(clone);
				}
			})()
		});

		await this._activityMonitor.startActivity({
			text: "Removing restricting conditions...",
			promise: (async () => {
				for (let i = 0; i < lootTables.length; i++) {
					if (i % 100 === 0) {
						//Perform a small UI-update every 100 files.
						await sleep(0);
					}

					let originalFile = finalDatapack.get<LootTableFile>(lootTables[i])!;

					let conditions = [
						...originalFile.getConditions("minecraft:killed_by_player"),
						...originalFile.getConditions("minecraft:block_state_property"),
					]

					for (const condition of conditions) {
						condition.remove();
					}
				}
			})()
		});

		if (this.otherOptions.dropChance100) {
			await this._activityMonitor.startActivity({
				text: "Manipulating drop chances...",
				promise: (async () => {
					for (let i = 0; i < lootTables.length; i++) {
						if (i % 100 === 0) {
							//Perform a small UI-update every 100 files.
							await sleep(0);
						}

						let originalFile = finalDatapack.get<LootTableFile>(lootTables[i])!;

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
				})()
			});
		}

		let finalDatapackBlob = await this._activityMonitor.startActivity({
			text: "Generating final data pack...",
			promise: DatapackSerializer.packUp(finalDatapack)
		});

		await this._activityMonitor.startActivity({
			text: "Downloading finished data pack...",
			promise: (async () => {
				let a = document.createElement("a");
				a.download = `${finalDatapack.name}.zip`;
				a.href = window.URL.createObjectURL(finalDatapackBlob);
				a.click();
			})()
		});
	}
}

type DataPackInformation = {
	packFormat: number,
	packPng?: IFile
}