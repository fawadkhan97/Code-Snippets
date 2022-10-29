import { AuthenticationService } from './../../../../services/authentication.service';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ParentService } from 'src/app/services/parent.service';
import { UtilService } from 'src/app/services/util.service';
import { ParentConsent } from 'src/app/models/dto/parent-consent';
import {
  AbstractControlOptions,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ConfirmPasswordValidator } from 'src/app/utils/confirm-password-validator';
import { Country } from 'src/app/models/dto/country';
import { maskSSN, formatSSN } from 'src/app/utils/ssn-util';
import { take } from 'rxjs/operators';
import { Constants } from 'src/app/utils/Constants';
import { NoWhitespaceValidator } from 'src/app/utils/no-white-space-validator';
import { ToasterService } from 'src/app/services/toaster.service';

@Component({
  selector: 'app-personal-info',
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.css', '../../parent.component.css'],
})
export class PersonalInfoComponent implements OnInit {
  @Input() isUpdateRequest: boolean;
  isUpdateDataRequest: boolean;

  parent: ParentConsent;

  errors: Array<string> = new Array();

  personalInfoForm: FormGroup;

  submitted = false;

  orignalSSN: string;

  showSSn: boolean = false;
  hidePass: boolean = true;
  hideConfirmPass: boolean = true;
  disbledPasswordInput: boolean = true;

  dateValue: string = '';
  /**
   *
   * @param parentService
   * @param utilService
   * @param router
   * @param authService
   */
  constructor(
    private parentService: ParentService,
    public utilService: UtilService,
    private notifyService: ToasterService,
    private router: Router,
    private authService: AuthenticationService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute
  ) {
    this.utilService.isLogin = this.authService.isUserLogin();
    if (this.utilService.isLogin) {
      this.parent = this.utilService.getParentInSession();
    }

    this.utilService.stateList = this.utilService.getStatesFromLocalStorage();
    this.utilService.countries =
      this.utilService.getCountriesFromLocalStorage();
  }

  ngOnInit() {
    console.log(
      'personal info component intialized  ',
      this.activatedRoute.url.toString()
    );
    // this.utilService.showAlert("danger","some message sdfsdfsdfsdfsdfdsfsdfdsfdsfdsfsdf" , false)
    this.activatedRoute.data.pipe(take(1)).subscribe((data) => {
      console.log('is updateParentPersonalInfo ? ', data.isUpdateDataRequest); // ouput data
      this.isUpdateDataRequest = data.isUpdateDataRequest;
    });

    this.parent = new ParentConsent();
    this.initiliazeData();
    if (this.authService.isUserLogin()) {
      this.findParentByEmail();
    }

    if (this.utilService.stateList == null) {
      this.utilService.loadStates();
    }
    if (this.utilService.countries == null) {
      this.utilService.loadCountries();
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.personalInfoForm.invalid) {
      window.scrollTo(0, 0);
      console.log(
        'state error is ',
        this.personalInfoForm.controls.state.errors
      );
      console.log('form value  is ', this.personalInfoForm.controls);
      return;
    }
    this.buildRequest();

    console.log('parent request is ', this.parent);
    // check if its update case or new registartion case
    if (!!this.isUpdateDataRequest) {
      // update case
      console.log('update request');
      this.updateParentPersonalInfo();
    } else {
      // new sign up case
      this.saveParentPersonalInfo();
      console.log('create request');
    }
  }

  //
  private updateParentPersonalInfo() {
    this.parentService.updatePersonalinfo(this.parent).subscribe(
      (result) => {
        let res = result.body;
        console.log(res);
        if (res.code == 400) {
          this.notifyService.showError(result.body.message, 'Error');
          return;
        }
        if (res.code == 200) {
          console.log('user updated');
          this.utilService.setParentInSession(res.parent);
          this.utilService.setUpdatedParentConsent(res.parent);
          this.notifyService.showSuccess(result.body.message, 'Success');
        } else {
          this.errors.push(res.message);
          window.scrollTo(0, 0);
        }
      },
      (error) => {
        this.notifyService.showError(error.message, 'Error');
        console.log(error);
      }
    );
  }

  private saveParentPersonalInfo() {
    this.parentService.postPersonalinfo(this.parent).subscribe((result) => {
      let res = result.body;
      console.log(res);
      if (res.code == 400) {
        this.notifyService.showError(result.body.message, 'Error');
        return;
      }
      if (res.code == 200) {
        if (!this.authService.isUserLogin()) {
          this.utilService.setGuardianInSession(res.parent.guardianId);
          this.authService.setLogInResponseInSession(res.parent.emailAddress);
          this.utilService.setParentInSession(res.parent);
          this.utilService.setUpdatedParentConsent(res.parent);
          this.utilService.parent = res.parent;
        }
        this.utilService.setGuardianInSession(res.parent.guardianId);
        this.router.navigate([Constants.parentHomeRoutePath]);
      } else {
        let msg: string = res.message ? res.message : 'an error has occurred';
        this.errors.push(msg);
        window.scrollTo(0, 0);
      }
    });
  }
  /**
   *  find student by email
   */
  findParentByEmail(): void {
    this.errors = [];

    this.parentService
      .findByEmail(this.authService.getLogInEmail())
      .subscribe((result) => {
        if (result?.body.code == 100 || result.body.code == 200) {
          this.parent = result.body.parent;
          console.log('parent Find by email', this.parent);
          this.utilService.setGuardianInSession(result.body.parent.guardianId);

          let res = maskSSN(this.parent.ssnNo);
          if (res != null && res.maskedSSN != null) {
            this.personalInfoForm.get('ssn').patchValue(res.maskedSSN);
            this.orignalSSN = res.orignalSSN;
            this.parent.ssnNo = res.maskedSSN;
          }
          console.log(res);
          if (this.utilService.stateList != null) {
            console.log('state of parent is ', result.body.parent.state);
            let state = this.utilService.stateList.find(
              (x) =>
                x.stateId == result.body.parent.state ||
                x.stateCode == result.body.parent.state
            );
            console.log('state found is ', state);
            this.parent.state = state.stateId;
          }
          this.parent.country = 1;

          //  this.request.dateOfBirth = DateUtil.convetMilliToFullDateString(this.request.dateOfBirth)

          this.initiliazeData();
        } else {
          // this.errors.push(result.body.message);\
          this.notifyService.showError(result.body.message, 'Error');
        }
      });
  }

  /**
   *
   */
  initiliazeData(): void {
    let parent = this.parent;
    console.log('parent is ', parent.state, parent.country);
    let confirmPassword =
      parent.guardianId != undefined && parent.guardianId != 0
        ? parent.password
        : parent.confirmPassword;
    this.personalInfoForm = this.fb.group(
      {
        firstName: [
          parent.firstName,
          [Validators.required, NoWhitespaceValidator],
        ],
        lastName: [
          parent.lastName,
          [Validators.required, NoWhitespaceValidator],
        ],
        phoneNumber: [
          parent.phoneNumber == undefined || parent.phoneNumber == null
            ? ''
            : parent.phoneNumber,
          [
            Validators.pattern(/^\s*\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\s*$/),
            Validators.required,
          ],
        ],
        ssn: [
          parent.ssnNo,
          [
            Validators.required,
            Validators.minLength(11),
            Validators.maxLength(11),
          ],
        ],
        dob: [this.parent.dateOfBirth, [Validators.required]],
        emailAddress: [
          parent.emailAddress,
          [Validators.required, NoWhitespaceValidator],
        ],
        password: [
          {
            value: parent.password,
            disabled: this.disbledPasswordInput && this.isUpdateDataRequest,
          },
          [Validators.required, Validators.minLength(6)],
        ],
        confirmPassword: [
          {
            value: confirmPassword,
            disabled: this.disbledPasswordInput && this.isUpdateDataRequest,
          },
          [Validators.required],
        ],
        address2: [parent.address2],
        address1: [
          parent.streetAddress,
          [Validators.required, NoWhitespaceValidator],
        ],
        city: [parent.city, [Validators.required, NoWhitespaceValidator]],
        state: [parent.state, [Validators.required]],
        zip: [
          parent.zip,
          [
            Validators.required,
            Validators.pattern(/(^\d{5}$)|(^\d{9}$)|(^\d{5}-\d{4}$)/),
          ],
        ],
        country: [parent.country, [Validators.required]],
      },
      {
        validator: ConfirmPasswordValidator('password', 'confirmPassword'),
      } as AbstractControlOptions
    );
  }

  /**
   *
   */
  buildRequest(): void {
    this.parent.firstName =
      this.personalInfoForm.controls.firstName.value?.trim();
    this.parent.lastName =
      this.personalInfoForm.controls.lastName.value?.trim();
    this.parent.phoneNumber = this.personalInfoForm.controls.phoneNumber.value;
    this.parent.dateOfBirth = new Date( this.personalInfoForm.controls.dob.value);
    this.parent.ssnNo = formatSSN(this.orignalSSN);
    this.parent.emailAddress =
      this.personalInfoForm.controls.emailAddress.value?.trim();
    this.parent.streetAddress =
      this.personalInfoForm.controls.address1.value?.trim();
    this.parent.address2 =
      this.personalInfoForm.controls.address2.value?.trim();
    this.parent.password =
      this.personalInfoForm.controls.password.value?.trim();
    this.parent.city = this.personalInfoForm.controls.city.value?.trim();
    this.parent.state = this.personalInfoForm.controls.state.value;
    this.parent.country = this.personalInfoForm.controls.country.value;
    this.parent.zip = this.personalInfoForm.controls.zip.value;

    console.log(this.parent);
  }

  showSnn(): void {
    console.log('showSnn');
    this.showSSn = true;
    if (this.orignalSSN != null && this.orignalSSN != undefined) {
      this.personalInfoForm.get('ssn').setValue(this.orignalSSN);
    }
  }

  ssnFocusOut(value: string): void {
    console.log('ssn focus out ', value);
    this.showSSn = false;
    if (value.includes('*')) {
      return;
    }
    let res = maskSSN(value);
    if (res != null && res.maskedSSN != null) {
      this.personalInfoForm.get('ssn').patchValue(res.maskedSSN);
      console.log('ssn orignal from res is  ', res.orignalSSN);
      this.orignalSSN = res.orignalSSN;
    }
  }

  toggleSSN(): void {
    let ssn = this.personalInfoForm.controls.ssn.value;
    console.log('toggle ssn  ', this.showSSn, 'orignalSSN', this.orignalSSN);

    this.showSSn = !this.showSSn;

    console.log('ssn is ', ssn, 'show ssn ', this.showSSn);
    if (this.showSSn) {
      this.personalInfoForm.get('ssn').patchValue(this.orignalSSN);
    }
  }

  formatSSN(ssn: string) {
    // if formattedSSN is not undefined then set
    console.log('ssn is ', ssn);

    this.personalInfoForm.controls.ssn.patchValue(formatSSN(ssn));
  }

  setDobDate(event: any): void {
    console.log('date is ', event, new Date(event));
    this.parent.dateOfBirth = new Date(event);
    this.personalInfoForm.controls.dob.setValue(event);
  }
}
