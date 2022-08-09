import { Injectable } from '@angular/core';
import { ActivityMonitorService } from 'src/app/common/services/activity-monitor/activity-monitor.service';
import { DatapackSerializer } from 'src/lib/ts-datapack-fflate/datapack-serializer';
import { Datapack } from 'src/lib/ts-datapack/datapack';
import { PackFormat } from 'src/lib/ts-datapack/enums/packformat';
import { GenericAdvancement } from 'src/lib/ts-datapack/generic-advancement';
import { GenericFile } from 'src/lib/ts-datapack/genericfile';
import { IFile } from 'src/lib/ts-datapack/interfaces/file';
import { IFolder } from 'src/lib/ts-datapack/interfaces/folder';
import { addMainDatapackAdvancement, deepCopy, filenameWithoutExtension, seededRandom, shuffle, sleep } from 'src/lib/utils';

@Injectable()
export class CraftingRecipeRandomizerService {
	private _loadedCraftingRecipes: Indexable = {};

	public dataPackInfo: DataPackInformation = {
		packFormat: PackFormat.Invalid
	};

	public selectedCraftingRecipes: string[] = [];

	public set loadedCraftingRecipes(craftingRecipes: any) {
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

		let flattenedCraftingRecipes: Indexable = {};
		flatten(craftingRecipes, "", "/", flattenedCraftingRecipes);
		this._loadedCraftingRecipes = flattenedCraftingRecipes;
	}

	constructor(
		private _activityMonitor: ActivityMonitorService
	) {
	}

	private prepareDatapacks() {
		let intermediaryDatapack = new Datapack();

		for (const [key, value] of Object.entries(this._loadedCraftingRecipes)) {
			let craftingRecipeFile = new GenericFile(key, "json", value);
			intermediaryDatapack.set(craftingRecipeFile);
		}

		let allCraftingRecipePaths = intermediaryDatapack.allFilePaths
			.filter(x => x.startsWith("data/minecraft/recipes/"));

		let removedCraftingRecipes = allCraftingRecipePaths
			.filter(x => !this.selectedCraftingRecipes.includes(x));

		for (const craftingRecipePath of removedCraftingRecipes) {
			let craftingRecipeFolder = craftingRecipePath.substring(0, craftingRecipePath.lastIndexOf("/"));
			let filename = craftingRecipePath.substring(craftingRecipePath.lastIndexOf("/") + 1);
			intermediaryDatapack.get<IFolder>(craftingRecipeFolder)?.delete(filename);
		}

		let finalDatapack = new Datapack();

		addMainDatapackAdvancement(finalDatapack);

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
				finalDatapack.name = `random_recipes_${seed}`;
				finalDatapack['pack.mcmeta'].description = `Crafting-Recipe Randomizer\nSeed: ${seed}`;
			})()
		});

		let craftingRecipes = intermediaryDatapack.allFilePaths.filter(x => x.startsWith("data/minecraft/recipes/"));
		let shuffledCraftingRecipes = shuffle([...craftingRecipes], seededRandom(seed));

		await this._activityMonitor.startActivity({
			text: "Generating cheatsheet...",
			promise: (async () => {
				let cheatsheet = "";
				for (let i = 0; i < craftingRecipes.length; i++) {
					cheatsheet += `${filenameWithoutExtension(craftingRecipes[i])}'s recipe crafts ${filenameWithoutExtension(shuffledCraftingRecipes[i])}\n`;
				}

				finalDatapack.set(new GenericFile("cheatsheet.txt", "string", cheatsheet));
			})()
		});

		await this._activityMonitor.startActivity({
			text: "Shuffling crafting recipes...",
			promise: (async () => {
				for (let i = 0; i < craftingRecipes.length; i++) {
					if (i % 100 === 0) {
						//Perform a small UI-update every 100 files.
						await sleep(0);
					}

					let originalData = <Indexable>intermediaryDatapack.get<GenericFile>(craftingRecipes[i])!.data;
					let replacementData = <Indexable>intermediaryDatapack.get<GenericFile>(shuffledCraftingRecipes[i])!.data;

					let finalFile = new GenericFile(craftingRecipes[i], "json", deepCopy(originalData));

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

					finalDatapack.set(finalFile);
				}
			})()
		});

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

//TODO: The Indexable type needs to be replaced with a proper recipe type, implemented in the ts-datapack at some point.
type Indexable = { [key: string]: any };

type DataPackInformation = {
	packFormat: number,
	packPng?: IFile
}