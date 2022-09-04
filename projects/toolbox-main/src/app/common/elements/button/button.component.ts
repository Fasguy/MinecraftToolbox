import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'button[standard]',
	template: '<ng-content></ng-content>',
	styleUrls: ['./button.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
}