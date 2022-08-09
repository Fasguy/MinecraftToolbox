import { Component } from '@angular/core';
import { TitleService } from 'src/app/common/services/title-service/title.service';

@Component({
	selector: 'tbx-info-tab',
	templateUrl: './info-tab-view.component.html',
	styleUrls: ['./info-tab-view.component.scss']
})
export class InfoTabViewComponent {
	constructor(
		titleService: TitleService
	) {
		titleService.setTitle("Main Menu");
	}
}