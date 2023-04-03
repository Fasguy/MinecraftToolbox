import { Injectable, OnDestroy, OnInit } from "@angular/core";
import { Remote, wrap } from "comlink";
import { ActivityMonitorService } from "src/app/common/services/activity-monitor/activity-monitor.service";
import { download } from "src/lib/utils";
import { LootTableRandomizerWorker } from "../../workers/loot-table-randomizer/loot-table-randomizer.worker";

@Injectable()
export class LootTableRandomizerService implements OnDestroy, OnInit {
	private _realWorker = new Worker(new URL("../../workers/loot-table-randomizer/loot-table-randomizer.worker", import.meta.url));
	private _worker!: Remote<LootTableRandomizerWorker>;

	public constructor(
		private _activityMonitor: ActivityMonitorService
	) {
	}

	public async ngOnInit() {
		this._worker = await this._activityMonitor.startActivity({
			text: "Starting service...",
			promise: new (wrap<typeof LootTableRandomizerWorker>(this._realWorker))()
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
			promise: this._worker.prepareDataPack(options.seed, options.selectedLootTables)
		});

		await this._activityMonitor.startActivity({
			text: "Shuffling loot tables...",
			promise: this._worker.shuffleLootTables()
		});

		await this._activityMonitor.startActivity({
			text: "Generating cheatsheet...",
			promise: this._worker.generateCheatsheet()
		});

		await this._activityMonitor.startActivity({
			text: "Removing restricting conditions...",
			promise: this._worker.removeConditions()
		});

		if (options.dropChance100) {
			await this._activityMonitor.startActivity({
				text: "Manipulating drop chances...",
				promise: this._worker.manipulateDropChances()
			});
		}

		if (options.deadEndIndicator) {
			await this._activityMonitor.startActivity({
				text: "Replacing empty loot-tables with dead end indicator item...",
				promise: this._worker.replaceEmptyWithIndicator()
			});
		}

		let finalDatapackData = await this._activityMonitor.startActivity({
			text: "Generating final data pack...",
			promise: this._worker.finalize()
		});

		await this._activityMonitor.startActivity({
			text: "Downloading finished data pack...",
			promise: (async () => download(`${finalDatapackData.filename}.zip`, finalDatapackData.href))()
		});
	}
}

type RandomizeOptions = {
	seed: number;
	dropChance100: boolean;
	deadEndIndicator: boolean;
	selectedLootTables: string[];
}