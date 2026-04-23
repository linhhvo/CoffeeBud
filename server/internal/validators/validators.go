package validators

import (
	"slices"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

var validActionType validator.Func = func(fl validator.FieldLevel) bool {
	validTypes := []string{"coffee", "water", "break"}

	actionType, ok := fl.Field().Interface().(string)
	if ok {
		if !slices.Contains(validTypes, actionType) {
			return false
		}
	}
	return true
}

func ConfigCustomValidators() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("validActionType", validActionType)
	}
}
