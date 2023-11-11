import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { download } from 'src/lib/utils';
import { IWindow } from '../../window/window.component';

@Component({
	templateUrl: './download.component.html',
	styleUrls: ['./download.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadComponent implements OnInit, OnDestroy, IWindow {
	public title: string = "Download";

	public href!: string;
	public name!: string;

	public ngOnInit() {
		download(this.name, this.href);
	}

	public ngOnDestroy() {
		URL.revokeObjectURL(this.href);
	}
}