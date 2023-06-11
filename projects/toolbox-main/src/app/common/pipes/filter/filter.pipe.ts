import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
	name: "filter"
})
export class FilterPipe implements PipeTransform {
	public transform(value: Array<any>, callback: any): any {
		return value.filter(callback);
	}
}