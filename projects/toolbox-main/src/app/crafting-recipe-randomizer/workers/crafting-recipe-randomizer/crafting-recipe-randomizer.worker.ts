import { expose } from "comlink";
import { Unzip, UnzipInflate } from "fflate";
import { DatapackSerializer } from "../../../../lib/ts-datapack-fflate/datapack-serializer";
import { Datapack } from "../../../../lib/ts-datapack/datapack";
import { GenericAdvancement } from "../../../../lib/ts-datapack/generic-advancement";
import { GenericFile } from "../../../../lib/ts-datapack/genericfile";
import { IFolder } from "../../../../lib/ts-datapack/interfaces/folder";
import { Pack_MCMeta } from "../../../../lib/ts-datapack/pack_mcmeta";
import { addMainDatapackAdvancement, deepCopy, filenameWithoutExtension, seededRandom, shuffle } from "../../../../lib/utils";

export class CraftingRecipeRandomizerWorker {
	private _defaultCraftingRecipeFilePaths!: string[];
	private _shuffledCraftingRecipeFilePaths!: string[];
	private _loadedDatapack: Datapack = new Datapack();
	private _intermediaryDatapack!: Datapack;
	private _finalDatapack!: Datapack;

	private _seed!: bigint;

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
							this._loadedDatapack.set(new GenericFile(filePath, "json", JSON.parse(textDecoder.decode(fileBytes))));
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
					|| filePath.startsWith("data/minecraft/recipes/")) {
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
			meta: this._loadedDatapack.get<GenericFile>(".fasguystoolbox/meta.json")?.data ?? {}
		}
	}

	public prepareDataPack(seed: bigint, selectedCraftingRecipes: string[]) {
		this._seed = seed;

		this._intermediaryDatapack = new Datapack();
		this._finalDatapack = new Datapack();

		this._finalDatapack.name = `random_crafting_${seed}`;
		this._finalDatapack["pack.mcmeta"].description = `Crafting-Recipe Randomizer\nSeed: ${seed}`;
		this._finalDatapack["pack.mcmeta"].packFormat = this._loadedDatapack["pack.mcmeta"].packFormat;
		this._finalDatapack.set(this._loadedDatapack.get("pack.png")!);

		for (const recipePath of this._loadedDatapack.allFilePaths.filter(x => x.startsWith("data/minecraft/recipes/"))) {
			let recipeFile = this._loadedDatapack.get<GenericFile>(recipePath)!.clone();
			recipeFile.name = recipePath;
			this._intermediaryDatapack.set(recipeFile);
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
	}

	public async generateCheatsheet() {
		let cheatsheet = "";
		for (let i = 0; i < this._defaultCraftingRecipeFilePaths.length; i++) {
			cheatsheet += `${filenameWithoutExtension(this._defaultCraftingRecipeFilePaths[i])}'s recipe crafts ${filenameWithoutExtension(this._shuffledCraftingRecipeFilePaths[i])}\n`;
		}

		this._finalDatapack.set(new GenericFile("cheatsheet.txt", "string", cheatsheet));
	}

	public async shuffleCraftingRecipes() {
		this._defaultCraftingRecipeFilePaths = this._intermediaryDatapack.allFilePaths.filter(x => x.startsWith("data/minecraft/recipes/"));
		this._shuffledCraftingRecipeFilePaths = shuffle([...this._defaultCraftingRecipeFilePaths], seededRandom(this._seed));

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

	public async generateSelectionData() {
		let selection = <CraftingRecipeSelectionData>(this._loadedDatapack.get<GenericFile>(".fasguystoolbox/selection.json")?.data ?? {});
		let selectionRegex = /^data\/[^\/\n]*\/recipes\/[^\/\n]*\.json$/gm;
		let recipesInLoadedFiles = this._loadedDatapack.allFilePaths.join("\n").matchAll(selectionRegex);

		function getGroupDefinition(type: string) {
			type = type.split(":")[1] ?? type;
			if (type.startsWith("crafting")) {
				//Any kind of general crafting is just grouped together under the "crafting" group.
				type = "crafting";
			}

			return `toolbox:crafting_recipes_randomizer_group_${type}`;
		}

		function getResultingItem(recipe: any) {
			if (typeof recipe["result"] === "string") {
				return recipe["result"];
			} else if (typeof recipe["result"] === "object") {
				return recipe["result"]["item"];
			} else {
				return "";
			}
		}

		let selectionMenu: Indexable = {};

		for (const loadedFile of recipesInLoadedFiles) {
			let filePath = loadedFile[0];
			let data = <Indexable>this._loadedDatapack.get<GenericFile>(filePath)!.data;

			let resultingItem = getResultingItem(data);

			if (resultingItem === "") continue;

			let optGroup = getGroupDefinition(data["type"]);

			selectionMenu[optGroup] = selectionMenu[optGroup] ?? [];

			selectionMenu[optGroup].push({
				selected: !selection.unselected.includes(filePath),
				assetId: resultingItem,
				value: filePath
			});
		}

		return selectionMenu;
	}
}

expose(CraftingRecipeRandomizerWorker);

type Indexable = { [key: string]: any };

export type CraftingRecipeSelectionData = {
	unselected: string[];
}