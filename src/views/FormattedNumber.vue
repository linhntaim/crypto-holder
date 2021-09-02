<template lang="pug">
span {{ protected ? '****' : shownValue }}
</template>

<script>
export default {
    name: 'FormattedNumber',
    props: {
        value: Number,
        fractionDigits: {
            type: Number,
            default: 2,
        },
        protected: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        shownValue() {
            if (this.fractionDigits > 0) {
                return this.value.toFixed(this.fractionDigits).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
            }
            if (this.fractionDigits === 0) {
                return this.value.toFixed(this.fractionDigits).replace(/(\d)(?=(\d{3})+$)/g, '$1,')
            }
            const value = this.value.toString()
            return value.includes('.') ?
                value.replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
                : value.replace(/(\d)(?=(\d{3})+$)/g, '$1,')
        },
    },
}
</script>