import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { EntryGroup } from "src/app/common/elements/selection/selection.component";
import { ITool } from "src/app/common/interfaces/tool";
import { ActivityMonitorService } from "src/app/common/services/activity-monitor/activity-monitor.service";
import { AssetManagerService } from "src/app/common/services/asset-manager/asset-manager.service";
import { NetRequestService } from "src/app/common/services/net-request/net-request.service";
import { PanoramaService } from "src/app/common/services/panorama-service/panorama.service";
import { WindowService } from "src/app/common/services/window-service/window.service";
import { CraftingRecipeRandomizerService } from "src/app/crafting-recipe-randomizer/services/crafting-recipe-randomizer/crafting-recipe-randomizer.service";
import { exportSettings, importSettings, mapFormData, mergeDeep, randomMinecraftSeed, seedHelper } from "src/lib/utils";
import { CraftingRecipeRandomizerFAQComponent } from "../frequently-asked-questions/frequently-asked-questions.component";
import { CraftingRecipeRandomizerInstructionsComponent } from "../instructions/instructions.component";

@Component({
	selector: "tbx-crafting-recipe-randomizer-view",
	templateUrl: "./crafting-recipe-randomizer-view.component.html",
	styleUrls: ["./crafting-recipe-randomizer-view.component.scss"],
	providers: [CraftingRecipeRandomizerService]
})
export class CraftingRecipeRandomizerViewComponent implements OnInit, ITool {
	public readonly version: string;
	public readonly tool: string = "crafting-recipe-randomizer";

	protected craftingRecipes!: EntryGroup[];

	protected seed: string = randomMinecraftSeed();

	protected meta: { additionals: Additional[] } = {
		additionals: []
	};

	public constructor(
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
			promise: new Promise<Blob>((res, rej) => {
				this._netRequest.uncachedBlob(`resources/crafting-recipe-randomizer/${this.version}/data.zip`)
					.subscribe({
						next: res,
						error: rej
					});
			})
		});

		await this._activityMonitor.startActivity({
			text: "Preparing necessary data pack data...",
			promise: (async () => {
				let { meta } = await this._randomizerService.loadDataFromBlob(data);

				this.meta = mergeDeep(this.meta, meta);

				let entries: EntryGroup[] = [];

				await this._assetManagerService.loading;

				let selection = await this._randomizerService.generateSelectionData();

				for (const group of Object.keys(selection)) {
					entries.push({
						title: this._assetManagerService.getString(group),
						entries: selection[group].map((x: any) => {
							return {
								text: this._assetManagerService.getString(x.assetId),
								value: x.value,
								checked: x.selected
							}
						})
					});
				}

				this.craftingRecipes = entries;
			})()
		});
	}

	protected onSubmit(e: SubmitEvent) {
		e.preventDefault();
		e.stopPropagation();

		let submittedData = mapFormData(<HTMLFormElement>e.target);

		let seed = seedHelper(submittedData["seed"]);

		this._randomizerService.randomize({
			seed: seed,
			selectedCraftingRecipes: submittedData["selection[]"]
		});
	}

	protected showInstructions() {
		this.window.createWindow(CraftingRecipeRandomizerInstructionsComponent);
	}

	protected showFAQ() {
		this.window.createWindow(CraftingRecipeRandomizerFAQComponent);
	}

	protected exportSettings = exportSettings.bind(this);

	protected importSettings = importSettings.bind(this);
}

interface Additional {
	header: string;
	content: string;
}