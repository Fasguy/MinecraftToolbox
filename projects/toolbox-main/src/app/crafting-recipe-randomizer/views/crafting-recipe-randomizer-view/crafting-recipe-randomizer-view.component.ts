import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { strFromU8, unzip } from "fflate";
import { EntryGroup } from "src/app/common/elements/selection/selection.component";
import { ITool } from "src/app/common/interfaces/tool";
import { ActivityMonitorService } from "src/app/common/services/activity-monitor/activity-monitor.service";
import { AssetManagerService } from "src/app/common/services/asset-manager/asset-manager.service";
import { NetRequestService } from "src/app/common/services/net-request/net-request.service";
import { PanoramaService } from "src/app/common/services/panorama-service/panorama.service";
import { WindowService } from "src/app/common/services/window-service/window.service";
import { CraftingRecipeRandomizerService } from "src/app/crafting-recipe-randomizer/services/crafting-recipe-randomizer/crafting-recipe-randomizer.service";
import { exportSettings, importSettings, mapFormData, randomMinecraftSeed, seedHelper } from "src/lib/utils";
import { CraftingRecipeRandomizerFAQComponent } from "../frequently-asked-questions/frequently-asked-questions.component";
import { CraftingRecipeRandomizerInstructionsComponent } from "../instructions/instructions.component";

@Component({
	selector: "tbx-crafting-recipe-randomizer-view",
	templateUrl: "./crafting-recipe-randomizer-view.component.html",
	styleUrls: ["./crafting-recipe-randomizer-view.component.scss"],
	providers: [CraftingRecipeRandomizerService]
})
export class CraftingRecipeRandomizerViewComponent implements OnInit, ITool {
	public readonly version: string = "";
	public readonly tool: string = "crafting-recipe-randomizer";

	public craftingRecipes!: EntryGroup[];

	public seed: string = randomMinecraftSeed();

	constructor(
		private _panorama: PanoramaService,
		private _netRequest: NetRequestService,
		private _randomizerService: CraftingRecipeRandomizerService,
		private _activityMonitor: ActivityMonitorService,
		private _assetManagerService: AssetManagerService,
		public window: WindowService,
		activatedRoute: ActivatedRoute,
		router: Router
	) {
		this.version = activatedRoute.snapshot.paramMap.get("version")!;

		//A simple compatibility rewrite, so that bookmarked links that end in ".X" get turned into ".0"
		if (this.version.endsWith(".X")) {
			this.version = this.version.substring(0, this.version.length - 2) + ".0";

			router.navigate([`../${this.version}`], { relativeTo: activatedRoute });
		}
	}

	public async ngOnInit() {
		await this._randomizerService.ngOnInit();

		this._panorama.setIndex(this.version);

		let data = await this._activityMonitor.startActivity({
			text: "Downloading necessary data...",
			promise: new Promise<ArrayBuffer>((res, rej) => {
				this._netRequest.binary(`resources/crafting-recipe-randomizer/${this.version}/data.zip`)
					.subscribe({
						next: res,
						error: rej
					});
			})
		});

		let dataCopy = new Uint8Array(new ArrayBuffer(data.byteLength));
		dataCopy.set(new Uint8Array(data));

		await this._assetManagerService.loading;

		await this._activityMonitor.startActivity({
			text: "Preparing necessary data pack data...",
			promise: new Promise<void>(async (res, rej) => {
				unzip(dataCopy, (err, result) => {
					if (err) {
						rej(err);
						return;
					}

					let dataJson: CraftingRecipeSelectionData = JSON.parse(strFromU8(result["selection_menu.json"]));

					let selectionList: EntryGroup[] = [];

					for (const group of Object.keys(dataJson)) {
						selectionList.push({
							title: this._assetManagerService.getString(group),
							entries: dataJson[group].map(x => {
								return {
									text: this._assetManagerService.getString(x.assetId),
									value: x.value,
									checked: x.selected
								}
							})
						});
					}

					this.craftingRecipes = selectionList;

					res();
				});

				await this._randomizerService.loadDatapackFiles(dataCopy);
			})
		});
	}

	public onSubmit(e: SubmitEvent) {
		e.preventDefault();
		e.stopPropagation();

		let submittedData = mapFormData(<HTMLFormElement>e.target);

		let seed = seedHelper(submittedData["seed"]);

		this._randomizerService.randomize({
			seed: seed,
			selectedCraftingRecipes: submittedData["selection[]"]
		});
	}

	public showInstructions() {
		this.window.createWindow(CraftingRecipeRandomizerInstructionsComponent);
	}

	public showFAQ() {
		this.window.createWindow(CraftingRecipeRandomizerFAQComponent);
	}

	protected exportSettings = exportSettings.bind(this);

	protected importSettings = importSettings.bind(this);
}

interface CraftingRecipeSelectionData {
	[group: string]: CraftingRecipeSelectionEntry[];
}

interface CraftingRecipeSelectionEntry {
	selected: boolean;
	assetId: string;
	value: string;
}