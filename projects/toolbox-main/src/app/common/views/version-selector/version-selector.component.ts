import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ActivityMonitorService } from '../../services/activity-monitor/activity-monitor.service';

@Component({
	selector: 'tbx-version-selector',
	templateUrl: './version-selector.component.html',
	styleUrls: ['./version-selector.component.scss']
})
export class VersionSelectorViewComponent implements OnInit {
	public versionGroups: VersionGroup[] = [];

	constructor(
		private _activatedRoute: ActivatedRoute,
		private _http: HttpClient,
		private _activityMonitor: ActivityMonitorService
	) {
	}

	ngOnInit(): void {
		this._activatedRoute.data.subscribe(data => {
			this._activityMonitor.startActivity({
				text: "Loading versionlist...",
				promise: new Promise<void>((res, rej) => {
					this._http.get<VersionGroup[]>(data["versionInfo"])
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