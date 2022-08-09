import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { sleep } from 'src/lib/utils';
import { ActivityMonitorComponent } from '../../elements/activity-monitor/activity-monitor.component';
import { ErrorHandlerService } from '../error-handler/error-handler.service';

@Injectable({
	providedIn: 'root'
})
export class ActivityMonitorService {
	private _activityMonitor!: ActivityMonitorComponent;
	private _activities = new ObservableActivities();

	constructor(
		errorHandler: ErrorHandlerService
	) {
		this._activities.errorHandler = errorHandler;
	}

	public get activities() {
		return this._activities;
	}

	public setActivityMonitor(activityMonitor: ActivityMonitorComponent) {
		if (this._activityMonitor) throw new Error("An activity monitor is already set.");

		this._activityMonitor = activityMonitor;
		this._activities.subscribe(activities => {
			this._activityMonitor.enabled = activities.size > 0;
		});
	}

	public startActivity<TActivityReturn>(activity: Activity<TActivityReturn>) {
		this._activities.add(activity);
		return activity.promise;
	}
}

class ObservableActivities {
	private _behaviourActivityArray: BehaviorSubject<Set<Activity<any>>> = new BehaviorSubject<Set<Activity<any>>>(new Set<Activity<any>>());
	private _observableActivityArray: Observable<Set<Activity<any>>> = this._behaviourActivityArray.asObservable();

	public errorHandler!: ErrorHandlerService;

	public [Symbol.iterator]() {
		return this._behaviourActivityArray.getValue()[Symbol.iterator]();
	}

	public add(activity: Activity<any>) {
		this._observableActivityArray.pipe(take(1)).subscribe(activities => {
			activities.add(activity);
			this._behaviourActivityArray.next(activities);
			sleep(16)
				.then(() => activity.promise)
				.then(() => this.remove(activity))
				.catch(error => {
					this.remove(activity);
					this.errorHandler.error = error;
				});
		});
	}

	public remove(activity: Activity<any>) {
		this._observableActivityArray.pipe(take(1)).subscribe(activities => {
			activities.delete(activity);
			this._behaviourActivityArray.next(activities);
		})
	}

	public subscribe(next: (value: Set<Activity<any>>) => void) {
		this._observableActivityArray.subscribe(next);
	}
}

interface Activity<TReturn> {
	text: string,
	promise: Promise<TReturn>;
}