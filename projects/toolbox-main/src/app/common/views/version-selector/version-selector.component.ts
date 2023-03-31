import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { catchError, of } from "rxjs";
import { ActivityMonitorService } from "../../services/activity-monitor/activity-monitor.service";
import { NetRequestService } from "../../services/net-request/net-request.service";

@Component({
	selector: "tbx-version-selector",
	templateUrl: "./version-selector.component.html",
	styleUrls: ["./version-selector.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class VersionSelectorViewComponent implements OnInit {
	public versionGroups: VersionGroup[] = [];

	public constructor(
		private _activatedRoute: ActivatedRoute,
		private _netRequest: NetRequestService,
		private _activityMonitor: ActivityMonitorService,
		private _changeDetector: ChangeDetectorRef
	) {
		this._changeDetector.detach();
	}

	public ngOnInit(): void {
		this._activatedRoute.data.subscribe(async data => {
			await this._activityMonitor.startActivity({
				text: "Loading versionlist...",
				promise: new Promise<void>((res, rej) => {
					this._netRequest.get<VersionGroup[]>(data["versionInfo"])
						.pipe(catchError(error => {
							rej(error);

							return of([]);
						}))
						.subscribe(versions => {
							this.versionGroups = versions;
							res();
						});
				})
			});

			this._changeDetector.detectChanges();
		});
	}
}

type VersionGroup = {
	title: string;
	versions: Version[];
}

interface Version {
	title: string,
	id: string,
}