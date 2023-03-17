import { Injectable, Type, ViewContainerRef } from "@angular/core";
import { IWindow, WindowComponent } from "../../views/window/window.component";

@Injectable({
	providedIn: "root"
})
export class WindowService {
	public windowContainer!: ViewContainerRef;

	public createWindow<TWindow extends IWindow>(childComponent: Type<TWindow>) {
		let componentRef = this.windowContainer.createComponent(WindowComponent<TWindow>);

		//Detect changes, to initialize the component immediately.
		componentRef.changeDetectorRef.detectChanges();
		componentRef.instance.selfRef = componentRef;

		return componentRef.instance.createChildComponent(childComponent);
	}
}