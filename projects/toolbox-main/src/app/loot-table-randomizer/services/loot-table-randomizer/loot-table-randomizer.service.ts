import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { Remote, transfer, wrap } from 'comlink';
import { ActivityMonitorService } from 'src/app/common/services/activity-monitor/activity-monitor.service';
import { LootTableRandomizerWorker } from '../../workers/loot-table-randomizer/loot-table-randomizer.worker';

@Injectable()
export class LootTableRandomizerService implements OnDestroy, OnInit {
	private _realWorker = new Worker(new URL('../../workers/loot-table-randomizer/loot-table-randomizer.worker', import.meta.url));
	private _worker!: Remote<LootTableRandomizerWorker>;

	constructor(
		private _activityMonitor: ActivityMonitorService
	) {
	}

	public async ngOnInit() {
		this._worker = await new (wrap<typeof LootTableRandomizerWorker>(this._realWorker))();
	}

	public ngOnDestroy(): void {
		this._realWorker.terminate();
	}

	public async loadDatapackFiles(binaryDataPack: Uint8Array) {
		return this._worker.loadDatapackData(transfer(binaryDataPack, [binaryDataPack.buffer]));
	}

	public async randomize(options: RandomizeOptions) {
		await this._activityMonitor.startActivity({
			text: "Preparing the data pack...",
			promise: this._worker.prepareDataPack(options.seed, options.selectedLootTables)
		});

		await this._activityMonitor.startActivity({
			text: "Generating cheatsheet...",
			promise: this._worker.generateCheatsheet()
		});

		await this._activityMonitor.startActivity({
			text: "Shuffling loot tables...",
			promise: this._worker.shuffleLootTables()
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

		let finalDatapackData = await this._activityMonitor.startActivity({
			text: "Generating final data pack...",
			promise: this._worker.finalize()
		});

		await this._activityMonitor.startActivity({
			text: "Downloading finished data pack...",
			promise: (async () => {
				let a = document.createElement("a");
				a.download = `${finalDatapackData.filename}.zip`;
				a.href = finalDatapackData.href;
				a.click();
			})()
		});
	}
}

type RandomizeOptions = {
	seed: number;
	dropChance100: boolean;
	selectedLootTables: string[];
}