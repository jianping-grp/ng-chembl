import { Pipe, PipeTransform } from '@angular/core';
import {RestService} from '../services/rest/rest.service';
import {Observable} from 'rxjs/Observable';

@Pipe({
  name: 'molregnoToSmiles'
})
export class MolregnoToSmilesPipe implements PipeTransform {
  constructor(private rest: RestService) {}

  transform(molregno: any, args?: any): Observable<string>{
    return this.rest.getData(`chembl/compound-structures/${molregno}`)
      .map(data => data['compound_structures'].canonical_smiles)
  }

}
