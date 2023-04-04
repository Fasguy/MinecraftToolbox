import { expose } from "comlink";
import { Unzip, UnzipInflate } from "fflate";
import { LootTableFile } from "../../../../lib/ts-datapack-extensions/loot_table_file";
import "../../../../lib/ts-datapack-extensions/loot_table_file_ex";
import { DatapackSerializer } from "../../../../lib/ts-datapack-fflate/datapack-serializer";
import { Datapack } from "../../../../lib/ts-datapack/datapack";
import { GenericAdvancement } from "../../../../lib/ts-datapack/generic-advancement";
import { GenericFile } from "../../../../lib/ts-datapack/genericfile";
import { IFolder } from "../../../../lib/ts-datapack/interfaces/folder";
import { Pack_MCMeta } from "../../../../lib/ts-datapack/pack_mcmeta";
import { addMainDatapackAdvancement, filenameWithoutExtension, seededRandom, shuffle } from "../../../../lib/utils";

export class LootTableRandomizerWorker {
	private _defaultLootTableFilePaths!: string[];
	private _shuffledLootTableFilePaths!: string[];
	private _loadedDatapack: Datapack = new Datapack();
	private _intermediaryDatapack!: Datapack;
	private _finalDatapack!: Datapack;

	private _seed!: number;

	public async loadDataFromBlob(blob: Blob) {
		const textDecoder = new TextDecoder();
		const uz = new Unzip((file) => {
			const filePath = file.name.toLowerCase();
			if ((file.originalSize || 0) > 0) {
				const dataArrays: Uint8Array[] = [];

				file.ondata = (err, data, final) => {
					dataArrays.push(data);

					if (!final) return;

					let length = 0;
					for (const item of dataArrays) {
						length += item.length;
					}

					const fileBytes = new Uint8Array(length);

					let offset = 0;
					for (const item of dataArrays) {
						fileBytes.set(item, offset);
						offset += item.length;
					}

					switch (filePath.substring(filePath.lastIndexOf(".") + 1).toLowerCase()) {
						case "json":
							this._loadedDatapack.set(new LootTableFile(filePath, JSON.parse(textDecoder.decode(fileBytes))));
							break;
						case "png":
							this._loadedDatapack.set(new GenericFile(filePath, "binary", fileBytes));
							break;
						case "mcmeta":
							if (filePath === "pack.mcmeta") {
								this._loadedDatapack.set(new Pack_MCMeta(JSON.parse(textDecoder.decode(fileBytes))));
							}
							break;
						default:
							console.log(`The file ${filePath} is not supported.`);
							return;

					}
				}

				if (filePath === "pack.mcmeta"
					|| filePath === "pack.png"
					|| filePath.startsWith(".fasguystoolbox/")
					|| filePath.startsWith("data/minecraft/loot_tables/")) {
					file.start();
				}
			}
		});
		uz.register(UnzipInflate);

		const reader: ReadableStreamDefaultReader<Uint8Array> = blob.stream().getReader();
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				uz.push(new Uint8Array(0), true);
				break;
			}

			for (let i = 0; i < value!.length; i += 65536) {
				uz.push(value!.subarray(i, i + 65536));
			}
		}

		return {
			selection: <LootTableSelectionData>(this._loadedDatapack.get<GenericFile>(".fasguystoolbox/selection.json")?.data ?? {}),
			meta: this._loadedDatapack.get<GenericFile>(".fasguystoolbox/meta.json")?.data ?? {}
		}
	}

	public async prepareDataPack(seed: number, selectedLootTables: string[]) {
		this._seed = seed;

		this._intermediaryDatapack = new Datapack();
		this._finalDatapack = new Datapack();

		this._finalDatapack.name = `random_loot_${seed}`;
		this._finalDatapack["pack.mcmeta"].description = `Loot-Table Randomizer\nSeed: ${seed}`;
		this._finalDatapack["pack.mcmeta"].packFormat = this._loadedDatapack["pack.mcmeta"].packFormat;
		this._finalDatapack.set(this._loadedDatapack.get("pack.png")!);

		for (const lootTablePath of this._loadedDatapack.allFilePaths.filter(x => x.startsWith("data/minecraft/loot_tables/"))) {
			let lootTableFile = this._loadedDatapack.get<LootTableFile>(lootTablePath)!.clone();
			lootTableFile.name = lootTablePath;
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
	}

	public async generateCheatsheet() {
		let cheatsheet = "";
		for (let i = 0; i < this._defaultLootTableFilePaths.length; i++) {
			cheatsheet += `${filenameWithoutExtension(this._defaultLootTableFilePaths[i])} drops from ${filenameWithoutExtension(this._shuffledLootTableFilePaths[i])}\n`;
		}

		this._finalDatapack.set(new GenericFile("cheatsheet.txt", "string", cheatsheet));
	}

	public async shuffleLootTables() {
		this._defaultLootTableFilePaths = this._intermediaryDatapack.allFilePaths.filter(x => x.startsWith("data/minecraft/loot_tables/"));
		this._shuffledLootTableFilePaths = shuffle([...this._defaultLootTableFilePaths], seededRandom(this._seed));

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
				...originalFile.getConditionsWhenSiblingsExist("minecraft:location_check", "minecraft:block_state_property"),
			];

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

			let conditions = [
				...originalFile.getConditions("minecraft:random_chance"),
				...originalFile.getConditions("minecraft:random_chance_with_looting"),
			];

			for (const conditionKit of conditions) {
				if (conditionKit.data.condition !== "minecraft:random_chance"
					&& conditionKit.data.condition !== "minecraft:random_chance_with_looting") {
					continue;
				}

				conditionKit.data.chance = 1;
			}
		}
	}

	public async replaceEmptyWithIndicator() {
		let deadEnd = new LootTableFile("data/fasguys_toolbox/loot_tables/generic/dead_end.json", {
			type: "minecraft:block",
			pools: [
				{
					rolls: 1,
					entries: [
						{
							type: "minecraft:item",
							name: "minecraft:clock",
							functions: [
								{
									function: "minecraft:set_name",
									name: {
										text: "Time-waster",
										italic: false
									}
								},
								{
									function: "minecraft:set_lore",
									lore: [
										{
											text: "This loot-table chain ends here.",
											color: "#ffffff",
											italic: false
										}
									]
								}
							]
						}
					]
				}
			]
		});
		this._finalDatapack.set(deadEnd);

		for (const entry of this._defaultLootTableFilePaths) {
			let file = this._finalDatapack.get<LootTableFile>(entry)!;

			if (file.data.pools == null || file.data.pools.length === 0) {
				file.data = {
					pools: [
						{
							rolls: 1,
							entries: [
								{
									type: "minecraft:loot_table",
									name: "fasguys_toolbox:generic/dead_end"
								}
							]
						}
					]
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

interface LootTableSelectionData {
	[group: string]: LootTableSelectionEntry[];
}

interface LootTableSelectionEntry {
	selected: boolean;
	assetId: string;
	value: string;
}