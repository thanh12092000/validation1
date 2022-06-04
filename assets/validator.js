function validator(options) {
    // lấy element của form cần validate
    var formElement = document.querySelector(options.form)
    var seletorRules = {} // chứa tất cả rules của các seletor

    // lặp qua các thẻ cha để tìm ra element.parentElement có class là options.formGroupSelect
    function getParent(element, selector) {
        // ban đầu element là thẻ input
        while(element.parentElement){
            if(element.parentElement.matches(selector)) { // kiểm tra xem element.parentElement có class là options.formGroupSelect không
                return element.parentElement
            }
            element = element.parentElement
        }
    }

    // hàm thực hiện validate
    function validate(inputElement,rule) {
        var errorMessage 
        var errorElement = getParent( inputElement,options.formGroupSelect).querySelector(options.errorSelector)
        // var errorElement = inputElement.parentElement.querySelector(options.errorSelector)
        
        // lấy ra các rules của selector
        var rules = seletorRules[rule.seletor]

        // lặp qua từng rules & kiểm tra
        // nếu có lỗi thì dừng việc kiểm tra
        for(i=0; i<rules.length; i++) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](formElement.querySelector(rule.seletor + ':checked'));
                    break;
                default:
                    errorMessage = rules[i](inputElement.value)

            }

            if(errorMessage) break
        }

            if(errorMessage) {
                errorElement.innerText = errorMessage
                getParent( inputElement,options.formGroupSelect).classList.add('invalid')
            }else{
                errorElement.innerText = ''
                getParent( inputElement,options.formGroupSelect).classList.remove('invalid')

            }
        return !errorMessage // có errorMessage trả về true và không có thì trả về false
    } 


    if(formElement){
        // khi submit form
        formElement.onsubmit = function(e) {
            e.preventDefault(); // bỏ hành vi mặc định

            var isFormValid = true

            // Thực hiện lặp qua từng rules và validate
            options.rules.forEach(rule => {
                var inputElement = formElement.querySelector(rule.seletor)
                var isValid = validate(inputElement,rule)

                if(!isValid) { // nếu có 1 input không isValid
                    isFormValid = false
                }
            })

            
            if(isFormValid) { // nếu không có lỗi
                if(typeof options.onSubmit === 'function') {
                    
                    // select tất cả các thẻ có attribute là name và không có attribute là disabled
                    var enableInput = formElement.querySelectorAll('[name]:not([disabled])') // enableInput trả về NodeList
                    // chuyển enableInput sang array và reduce
                    var formValues = Array.from(enableInput).reduce(function(values,input) { 
                        switch(input.type) {
                            case 'radio':      
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case 'checkbox':
                                if(!input.matches(':checked')) {
                                    return values; 
                                }

                                if(!Array.isArray(values[input.name] )) {
                                    values[input.name] = []
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'file':
                                values[input.name] = input.files
                                break;
                            default:
                                values[input.name] = input.value // thêm key-value vào object

                        }
                        return values;
                    },{})   
                   
                    options.onSubmit(formValues)
                }

            }else{
                
            }
        }



        // lặp qua mỗi rules và xử lý(lắng nghe sk blur, input,...)
        options.rules.forEach(rule => {
            
            //  lưu lại các rules cho mỗi input
            if(Array.isArray(seletorRules[rule.seletor])) {
                seletorRules[rule.seletor].push(rule.test)
            }else{
                // lần đầu tiên chạy seletorRules[rule.seletor] không phải là 1 mảng nên sẽ chạy else trước 
                //sau đó đến lần thứ 2,3,4... chạy thì chạy if
                seletorRules[rule.seletor] = [rule.test] //lúc này seletorRules[rule.seletor] là 1 mảng
            }
            
            
            var inputElements = formElement.querySelectorAll(rule.seletor)
            Array.from(inputElements).forEach(function(inputElement) {
                // xử lý trường hợp blur khỏi input
                inputElement.onblur = () => {
                    validate(inputElement,rule)
    
                }
    
                // xử lý trường hợp mỗi khi người dùng nhập vào input
                inputElement.oninput = () => {
                    var errorElement = getParent( inputElement,options.formGroupSelect).querySelector(options.errorSelector)
                    errorElement.innerText = ''
                    getParent( inputElement,options.formGroupSelect).classList.remove('invalid')
                    
                }

                

            })

            
        });
    }

}

// nguyên tắc của rules:
// 1. khi có lỗi trả ra message lỗi
// 2. khi hợp lệ k trả ra cái gì

// định ngĩa rules

validator.isRequired = function(seletor,message) {
    return {
        seletor ,
        // kiểm tra xem người dùng đã nhập chưa
        test: function(value) {
            // nếu người dùng nhập đúng value thì trả ra undefined
            // còn ngược lại
            return value? undefined :message|| 'Vui lòng nhập trường này' 
        }

    }
}

validator.isEmail = function(seletor) {
    return {
        seletor ,
        // kiểm tra xem người dùng đã nhập đúng email chưa
        test: function(value,message) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            return regex.test(value)? undefined :message|| 'Trường này phải là email'
        }

    }
}

validator.minLength = function(seletor,min,message) {
    return {
        seletor,
        test: function(value) {
            return value.length >= min? undefined :message|| `Vui lòng nhập tối thiểu ${min} kí tự ` 
        }
    }
}

validator.isConfirmation = function(seletor,getConfirmValue,message) {
    return {
        seletor,
        test: function(value) {
            return value === getConfirmValue()? undefined : message|| `Giá trị nhập vào không chính xác ` 
        }
    }
}



