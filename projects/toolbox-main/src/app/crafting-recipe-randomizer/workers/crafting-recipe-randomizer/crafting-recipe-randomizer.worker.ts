import { expose } from "comlink";
import { strFromU8, unzip } from "fflate";
import { DatapackSerializer } from '../../../../lib/ts-datapack-fflate/datapack-serializer';
import { Datapack } from '../../../../lib/ts-datapack/datapack';
import { PackFormat } from '../../../../lib/ts-datapack/enums/packformat';
import { GenericAdvancement } from '../../../../lib/ts-datapack/generic-advancement';
import { GenericFile } from '../../../../lib/ts-datapack/genericfile';
import { IFile } from '../../../../lib/ts-datapack/interfaces/file';
import { IFolder } from '../../../../lib/ts-datapack/interfaces/folder';
import { addMainDatapackAdvancement, deepCopy, filenameWithoutExtension, seededRandom, shuffle } from '../../../../lib/utils';

export class CraftingRecipeRandomizerWorker {
	private _dataPackData = {
		packFormat: PackFormat.Invalid,
		packPng: <IFile | undefined>undefined,
		loadedCraftingRecipes: <Indexable>{}
	}

	private _defaultCraftingRecipeFilePaths!: string[];
	private _shuffledCraftingRecipeFilePaths!: string[];

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

				let flattenedCraftingRecipes: Indexable = {};
				flatten(JSON.parse(strFromU8(result["recipes.json"])), "", "/", flattenedCraftingRecipes);
				this._dataPackData.loadedCraftingRecipes = flattenedCraftingRecipes;

				res();
			});
		});
	}

	public prepareDataPack(seed: number, selectedCraftingRecipes: string[]) {
		this._intermediaryDatapack = new Datapack();
		this._finalDatapack = new Datapack();

		this._finalDatapack.name = `random_crafting_${seed}`;
		this._finalDatapack['pack.mcmeta'].description = `Crafting-Recipe Randomizer\nSeed: ${seed}`;
		this._finalDatapack['pack.mcmeta'].packFormat = this._dataPackData.packFormat;
		this._finalDatapack.set(this._dataPackData.packPng);

		for (const [key, value] of Object.entries(this._dataPackData.loadedCraftingRecipes)) {
			let craftingRecipeFile = new GenericFile(key, "json", value);
			this._intermediaryDatapack.set(craftingRecipeFile);
		}
		let allCraftingRecipePaths = this._intermediaryDatapack.allFilePaths
			.filter(x => x.startsWith("data/minecraft/recipes/"));

		let removedCraftingRecipes = allCraftingRecipePaths
			.filter(x => !selectedCraftingRecipes.includes(x));

		for (const craftingRecipePath of removedCraftingRecipes) {
			let craftingRecipeFolder = craftingRecipePath.substring(0, craftingRecipePath.lastIndexOf("/"));
			let filename = craftingRecipePath.substring(craftingRecipePath.lastIndexOf("/") + 1);
			this._intermediaryDatapack.get<IFolder>(craftingRecipeFolder)?.delete(filename);
		}

		addMainDatapackAdvancement(this._finalDatapack);

		let advancement = new GenericAdvancement("data/fasguys_toolbox/advancements/crafting_recipe_randomizer/main.json");
		advancement.setValues({
			display: {
				icon: {
					item: "minecraft:crafting_table"
				},
				title: "Crafting-Recipe Randomizer",
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

		this._defaultCraftingRecipeFilePaths = this._intermediaryDatapack.allFilePaths.filter(x => x.startsWith("data/minecraft/recipes/"));
		this._shuffledCraftingRecipeFilePaths = shuffle([...this._defaultCraftingRecipeFilePaths], seededRandom(seed));
	}

	public async generateCheatsheet() {
		let cheatsheet = "";
		for (let i = 0; i < this._defaultCraftingRecipeFilePaths.length; i++) {
			cheatsheet += `${filenameWithoutExtension(this._defaultCraftingRecipeFilePaths[i])}'s recipe crafts ${filenameWithoutExtension(this._shuffledCraftingRecipeFilePaths[i])}\n`;
		}

		this._finalDatapack.set(new GenericFile("cheatsheet.txt", "string", cheatsheet));
	}

	public async shuffleCraftingRecipes() {
		for (let i = 0; i < this._defaultCraftingRecipeFilePaths.length; i++) {
			let originalData = <Indexable>this._intermediaryDatapack.get<GenericFile>(this._defaultCraftingRecipeFilePaths[i])!.data;
			let replacementData = <Indexable>this._intermediaryDatapack.get<GenericFile>(this._shuffledCraftingRecipeFilePaths[i])!.data;

			let finalFile = new GenericFile(this._defaultCraftingRecipeFilePaths[i], "json", deepCopy(originalData));

			let newResult = "";
			switch (typeof replacementData["result"]) {
				case "string":
					newResult = replacementData["result"];
					break;
				case "object":
					newResult = replacementData["result"]["item"];
					break;
			}

			switch (typeof originalData["result"]) {
				case "string":
					(<Indexable>finalFile.data)["result"] = newResult;
					break;
				case "object":
					(<Indexable>finalFile.data)["result"]["item"] = newResult;
					break;
			}

			this._finalDatapack.set(finalFile);
		}
	}

	public async finalize() {
		return {
			href: URL.createObjectURL(await DatapackSerializer.packUp(this._finalDatapack)),
			filename: this._finalDatapack.name
		}
	}
}

expose(CraftingRecipeRandomizerWorker);

type Indexable = { [key: string]: any };