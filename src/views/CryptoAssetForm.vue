<template lang="pug">
form.row.row-cols-lg-auto.g-3.align-items-center(@submit.prevent="onSubmit")
    .col-12
        .input-group
            .input-group-text
                label(for="inputSymbol") Symbol
            input#inputSymbol.form-control(v-model="symbol" type="text" placeholder="BTC" required)
    .col-12
        .input-group
            .input-group-text
                label(for="inputAmount") Amount
            input#inputAmount.form-control.text-end(v-model="amount" @focus="onAmountFocus" type="text" placeholder="0.0" required)
    .col-12
        button.btn.btn-primary(type="submit") Add crypto asset
</template>

<script>
export default {
    name: 'CryptoAssetForm',
    emits: ['submit'],
    data() {
        return {
            symbol: '',
            amount: 0,
        }
    },
    methods: {
        onAmountFocus($event) {
            const value = $event.target.value
            if (/^0+$/.test(value)) {
                $event.target.setSelectionRange(0, value.length)
            }
        },
        onSubmit() {
            this.$emit('submit', {
                cryptoAsset: {
                    symbol: this.symbol.toUpperCase(),
                    amount: parseFloat(this.amount),
                },
            })
            this.symbol = ''
            this.amount = 0
        },
    },
}
</script>

<style scoped>

</style>