import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatPaginator, MatSort, MatTableDataSource} from '@angular/material';
import {merge} from 'rxjs/observable/merge';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import {of as observableOf} from 'rxjs/observable/of';
import {RestService} from '../../../services/rest/rest.service';
import {Router} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {PageMeta} from '../../models';
import {DocCardComponent} from '../../../shared/chembl-explorer/doc-card/doc-card.component';
import {MoleculeDictionary} from '../../../chembl/models/molecule-dictionary';
import {CompoundStructures} from '../../../chembl/models/compound-structures';
import {Assay} from '../../../chembl/models/assay';
import {TargetDictionary} from '../../../chembl/models/target-dictionary';
import {CompoundProperties} from '../../../chembl/models/compound-properties';
import {GlobalService} from '../../../services/global/global.service';
import {JsmeStructureSize} from '../../../phin/jsme-structure-size';
import {ActivityTooltips} from '../../../phin/activity-tooltips.enum';
import {toFloat} from '../../../utils';

@Component({
  selector: 'app-activity-table',
  templateUrl: './activity-table.component.html',
  styleUrls: ['./activity-table.component.css']
})
export class ActivityTableComponent implements OnInit, AfterViewInit {

  pageMeta = new PageMeta();
  dataSource = new MatTableDataSource();
  isLoading = false;
  isLoadingError = false;
  restUrl: string;
  moleculeDictionariesList: MoleculeDictionary[];
  compoundPropertiesList: CompoundProperties[];
  assayList: Assay[];
  targetDictionaryList: TargetDictionary[];
  structureSize: JsmeStructureSize;
  @Input() includeParams = '&include[]=molregno.compoundproperties.' +
    '&include[]=molregno.compoundstructures.canonical_smiles' +
    '&exclude[]=molregno.compoundstructures.*&include[]=assay.tid.*';
  @Input() tableTitle = '';
  @Input() pageSize = 10;
  @Input() pageSizeOptions = [5, 10, 20, 50, 100];
  @Input() displayedColumns = [];
  @Input() restUrl$: Observable<string>;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() allColumns = [
    'structure', 'molregno', 'assay', 'assay_type', 'target_pref_name', 'standard_type', 'standard_value', 'published_type', 'published_value',
    'data_validity_comment', 'activity_comment', 'bao_endpoint',
    'standard_relation', 'published_relation', 'uo_units', 'standard_flag', 'pchembl_value',
    'doc',
  ];
  tooltipDisabled: boolean;
  activityTooltips = ActivityTooltips;
  toFloat = toFloat;

  constructor(private globalService: GlobalService,
              private rest: RestService,
              public docDialog: MatDialog) {
  }

  ngOnInit() {
    this.pageMeta.per_page = this.pageSize;
    this.globalService.disableTooltip$.subscribe(data => this.tooltipDisabled = data);
    this.globalService.tableStructureSize$.subscribe(
      size => this.structureSize = size
    );
  }

  ngAfterViewInit() {
    this.restUrl$.subscribe(data => this.restUrl = data);
    this.sort.sortChange.subscribe(() => this.pageMeta.page = 0);
    merge(this.sort.sortChange, this.paginator.page, this.restUrl$)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoading = true;
          return this.rest.getDataList(
            this.restUrl,
            this.paginator.pageIndex,
            this.paginator.pageSize,
            this.sort.direction === 'desc' ? `-${this.sort.active}` : this.sort.active,
            this.includeParams
          );
        }),
        map(data => {
          this.isLoading = false;
          this.isLoadingError = false;
          this.pageMeta = data['meta'];
          this.moleculeDictionariesList = data['molecule_dictionaries'];
          this.targetDictionaryList = data['target_dictionaries'];
          this.assayList = data['assays'];
          return data['activities'];
        }),
        catchError(() => {
          this.isLoadingError = true;
          this.isLoading = false;
          return observableOf([]);
        })
      )
      .subscribe(
        data => this.dataSource.data = data
      );
  }

  getCompoundPropertyies(molregno: number): CompoundProperties {
    if (this.compoundPropertiesList === undefined) {
      return;
    }
    return this.compoundPropertiesList.find(el => el.molregno === molregno);
  }

  getSmiles(molregno: number): string {
    const mol = this.moleculeDictionariesList
      .find(el => (<CompoundStructures>el.compoundstructures).molregno === molregno);
    if (mol) {
      return (<CompoundStructures>mol.compoundstructures).canonical_smiles;
    }
    return null;
  }

  openDocDialog(docId: number): void {
    this.docDialog.open(DocCardComponent, {
      width: '600px',
      data: {
        docId: docId
      }
    });
  }

  getTarget(tid: number): TargetDictionary {
    if (this.targetDictionaryList !== undefined) {
      return this.targetDictionaryList.find(el => el.tid === tid);
    }
    return;
  }

  getAssay(assayId: number): Assay {
    if (this.assayList !== undefined) {
      return this.assayList.find(el => el.assay_id === assayId);
    }
    return;
  }


}
