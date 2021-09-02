<template lang="pug">
formatted-number(v-if="toggle" :class="textClass" :value="modelValue" :fractionDigits="fractionDigits" :protected="protected" @click="onToggleTriggered")
input(v-else ref="numberInput" :class="inputClass" :value="input" type="text" @focus="onFocus" @blur="onBlur" @keyup.enter="onEnterPress" @keyup.esc="onEscapePress")
</template>

<script>
import FormattedNumber from './FormattedNumber'

export default {
    name: 'FormattedNumberInput',
    components: {FormattedNumber},
    props: {
        modelValue: Number,
        fractionDigits: {
            type: Number,
            default: 2,
        },
        textClass: {
            type: String,
            default: '',
        },
        inputClass: {
            type: String,
            default: '',
        },
        protected: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            input: this.modelValue,
            toggle: true,
        }
    },
    watch: {
        modelValue() {
            this.input = this.modelValue
        },
    },
    methods: {
        onToggleTriggered() {
            if (this.protected) {
                this.toggle = true
                return
            }
            this.toggle = !this.toggle
            if (!this.toggle) {
                this.$nextTick(() => this.$refs.numberInput.focus())
            }
        },
        onInput($event) {
            const value = parseFloat($event.target.value)
            this.$emit('update:modelValue', value ? value : 0)
        },
        onBlur($event) {
            this.onInput($event)
            this.onToggleTriggered()
        },
        onFocus($event) {
            const value = $event.target.value
            if (/^0+$/.test(value)) {
                $event.target.setSelectionRange(0, value.length)
            }
        },
        onEnterPress() {
            this.$refs.numberInput.blur()
        },
        onEscapePress() {
            this.input = this.modelValue
            this.$forceUpdate()
            this.$nextTick(() => this.$refs.numberInput.blur())
        },
    },
}
</script>