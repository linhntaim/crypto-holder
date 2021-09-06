<template lang="pug">
i.fas.fa-circle-notch.fa-spin.fa-sm.me-2(v-if="loading")
formatted-number(:value="cryptoAsset.price" :fractionDigits="-1")
</template>

<script>
import FormattedNumber from './FormattedNumber'
import {binancePriceService} from '@/utils'

export default {
    name: 'CryptoAssetPrice',
    components: {FormattedNumber},
    emits: ['updated'],
    props: {
        cryptoAsset: Object,
    },
    data() {
        return {
            loading: false,
        }
    },
    mounted() {
        this.syncPrice()
    },
    methods: {
        syncPrice() {
            this.syncPriceWithBinance(() => setTimeout(() => this.syncPrice(), 15000))
        },
        syncPriceWithBinance(callback = null) {
            binancePriceService.getPriceBySymbol(
                this.cryptoAsset.symbol,
                (price, priceUrl) => {
                    this.loading = false
                    this.$emit('updated', {price, priceUrl})
                    callback && callback()
                },
                response => {
                    this.loading = false
                    console.log(response)
                },
            )
        },
    },
}
</script>