/**
 * AUCTION ENGINE - ADVANCED FORM VALIDATION ENGINE
 * Tương thích cả khi mở trực tiếp file:// lẫn qua Web Server.
 */

class FormValidator {
  constructor(formElement, rules = {}) {
    this.form = formElement;
    this.rules = rules;
    this.errors = {};
    this.init();
  }

  init() {
    if (!this.form) return;
    this.form.setAttribute('novalidate', 'true');

    Object.keys(this.rules).forEach(fieldName => {
      const input = this.form.elements[fieldName];
      if (!input) return;

      input.addEventListener('blur', () => {
        this.validateField(fieldName);
      });

      input.addEventListener('input', () => {
        if (this.errors[fieldName]) {
          this.validateField(fieldName);
        }
      });
    });
  }

  validateField(fieldName) {
    const input = this.form.elements[fieldName];
    if (!input) return true;

    const fieldRules = this.rules[fieldName] || {};
    const value = input.value.trim();
    let errorMessage = '';

    if (fieldRules.required && !value) {
      errorMessage = fieldRules.requiredMessage || 'Trường này không được để trống!';
    } else if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errorMessage = `Độ dài tối thiểu phải từ ${fieldRules.minLength} ký tự trở lên.`;
    } else if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errorMessage = `Không được vượt quá ${fieldRules.maxLength} ký tự.`;
    } else if (fieldRules.numeric) {
      const num = Number(value);
      if (isNaN(num)) {
        errorMessage = 'Vui lòng nhập giá trị số hợp lệ!';
      } else if (fieldRules.min !== undefined && num < fieldRules.min) {
        errorMessage = `Giá trị tối thiểu phải từ ${fieldRules.min.toLocaleString()} trở lên!`;
      } else if (fieldRules.max !== undefined && num > fieldRules.max) {
        errorMessage = `Giá trị tối đa không được vượt quá ${fieldRules.max.toLocaleString()}!`;
      }
    } else if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errorMessage = fieldRules.patternMessage || 'Định dạng dữ liệu không hợp lệ!';
    } else if (typeof fieldRules.custom === 'function') {
      const customResult = fieldRules.custom(value, this.form);
      if (customResult !== true) {
        errorMessage = typeof customResult === 'string' ? customResult : 'Dữ liệu không thỏa mãn điều kiện!';
      }
    }

    if (errorMessage) {
      this.errors[fieldName] = errorMessage;
      this.showFieldError(input, errorMessage);
      return false;
    } else {
      delete this.errors[fieldName];
      this.showFieldSuccess(input);
      return true;
    }
  }

  showFieldError(input, message) {
    input.classList.remove('form-control--is-valid');
    input.classList.add('form-control--is-invalid');

    const parent = input.closest('.form-group') || input.parentElement;
    let feedback = parent.querySelector('.form-feedback');
    if (!feedback) {
      feedback = document.createElement('span');
      feedback.className = 'form-feedback form-feedback--error';
      parent.appendChild(feedback);
    }
    feedback.textContent = message;
    feedback.className = 'form-feedback form-feedback--error';
  }

  showFieldSuccess(input) {
    input.classList.remove('form-control--is-invalid');
    input.classList.add('form-control--is-valid');

    const parent = input.closest('.form-group') || input.parentElement;
    const feedback = parent.querySelector('.form-feedback');
    if (feedback) {
      feedback.textContent = '';
      feedback.className = 'form-feedback';
    }
  }

  validateAll() {
    let isValid = true;
    Object.keys(this.rules).forEach(fieldName => {
      const fieldValid = this.validateField(fieldName);
      if (!fieldValid) {
        isValid = false;
      }
    });

    if (!isValid) {
      const firstErrorField = Object.keys(this.errors)[0];
      if (firstErrorField && this.form.elements[firstErrorField]) {
        this.form.elements[firstErrorField].focus();
      }
    }

    return isValid;
  }

  getFormData() {
    const formData = new FormData(this.form);
    const data = {};
    for (let [key, val] of formData.entries()) {
      data[key] = val;
    }
    return data;
  }
}

const VALIDATION_REGEX = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  PHONE: /^[0-9+() -]{9,15}$/,
  POSITIVE_INT: /^[1-9]\d*$/
};

window.FormValidator = FormValidator;
window.VALIDATION_REGEX = VALIDATION_REGEX;
