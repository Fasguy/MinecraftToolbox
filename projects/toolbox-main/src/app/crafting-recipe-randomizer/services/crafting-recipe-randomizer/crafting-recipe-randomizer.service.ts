import { Injectable, OnDestroy, OnInit } from "@angular/core";
import { Remote, wrap } from "comlink";
import { ActivityMonitorService } from "src/app/common/services/activity-monitor/activity-monitor.service";
import { download } from "src/lib/utils";
import { CraftingRecipeRandomizerWorker } from "../../workers/crafting-recipe-randomizer/crafting-recipe-randomizer.worker";

@Injectable()
export class CraftingRecipeRandomizerService implements OnInit, OnDestroy {
	private _realWorker = new Worker(new URL("../../workers/crafting-recipe-randomizer/crafting-recipe-randomizer.worker", import.meta.url));
	private _worker!: Remote<CraftingRecipeRandomizerWorker>;

	public constructor(
		private _activityMonitor: ActivityMonitorService
	) {
	}

	public async ngOnInit() {
		this._worker = await this._activityMonitor.startActivity({
			text: "Starting service...",
			promise: new (wrap<typeof CraftingRecipeRandomizerWorker>(this._realWorker))()
		});
	}

	public ngOnDestroy(): void {
		this._realWorker.terminate();
	}

	public async loadDataFromBlob(blob: Blob) {
		return this._worker.loadDataFromBlob(blob);
	}

	public async randomize(options: RandomizeOptions) {
		await this._activityMonitor.startActivity({
			text: "Preparing the data pack...",
			promise: this._worker.prepareDataPack(options.seed, options.selectedCraftingRecipes)
		});

		await this._activityMonitor.startActivity({
			text: "Shuffling crafting recipes...",
			promise: this._worker.shuffleCraftingRecipes()
		});

		await this._activityMonitor.startActivity({
			text: "Generating cheatsheet...",
			promise: this._worker.generateCheatsheet()
		});

		let finalDatapackData = await this._activityMonitor.startActivity({
			text: "Generating final data pack...",
			promise: this._worker.finalize()
		});

		await this._activityMonitor.startActivity({
			text: "Downloading finished data pack...",
			promise: (async () => download(`${finalDatapackData.filename}.zip`, finalDatapackData.href))()
		});
	}

	public async generateSelectionData() {
		return this._worker.generateSelectionData();
	}
}

type RandomizeOptions = {
	seed: number;
	selectedCraftingRecipes: string[];
}