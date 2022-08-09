import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Route, Router, Routes } from '@angular/router';

@Component({
	selector: 'tbx-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
	public routes: Routes = [];

	@Input()
	public version!: string;

	constructor(
		private _changeDetector: ChangeDetectorRef,
		router: Router
	) {
		_changeDetector.detach();
		this.routes.push(...router.config);
	}

	ngOnInit(): void {
		this._changeDetector.detectChanges();
	}

	filterTitledRoutes(t: Route): boolean {
		return t.data?.["title"] != null;
	}
}