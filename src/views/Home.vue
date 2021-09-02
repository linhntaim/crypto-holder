<template lang="pug">
.home
    h1.pt-4.text-center.text-warning.pb-2 Crypto Holder
    .card(v-if="createEnabled")
        .card-body
            crypto-asset-form(@submit="onCryptoAssetFormSubmit")
    .card
        .card-body
            .table-responsive
                table.table.align-middle
                    thead
                        tr
                            th.text-center(colspan="4")
                                button.btn.btn-sm(@click="createEnabled = !createEnabled")
                                    i.fas.fa-plus-circle
                                button.btn.btn-sm(@click="onProtectionClicked")
                                    i.fas(:class="protected ? 'fa-eye-slash' : 'fa-eye'")
                                button.btn.btn-sm(@click="onExportClicked")
                                    i.fas.fa-file-export
                                button.btn.btn-sm(@click="onImportClicked")
                                    i.fas.fa-file-import
                            th.text-end
                                span.text-primary Initial
                            th.text-end
                                span(:class="{'text-danger': profit < 0, 'text-success': profit > 0, 'text-light': profit === 0}" @click="onProfitClicked") Profit
                            th.text-end
                                span.text-info Current
                    tbody
                        tr
                            td(colspan="4")
                            td.text-end
                                formatted-number-input(v-model="initial" :textClass="'text-primary'" :inputClass="'cell-control text-primary text-end'" :protected="protected")
                            td.text-end
                                formatted-number(:class="{'text-danger': profit < 0, 'text-success': profit > 0, 'text-light': profit === 0}" :value="profit" :protected="unprotectedProfit ? false : protected")
                            td.text-end
                                formatted-number.text-info(:value="current" :protected="protected")
                    thead
                        tr
                            th.text-center #
                            th
                            th Coin/Token
                            th.text-end.column-numeric Price
                            th.text-end.column-numeric Amount
                            th.text-end.column-numeric(@click="onCurrentSortClick")
                                | Current
                                i.fas.ms-2(:class="{'fa-sort text-light': sortCurrent === 0, 'fa-sort-up': sortCurrent === 1, 'fa-sort-down': sortCurrent === 2}")
                            th.text-end.column-numeric % Current
                    tbody
                        tr(v-for="(cryptoAsset, index) in cryptoAssets")
                            td.text-center {{ index + 1 }}
                            td.text-center.text-nowrap
                                button.btn.btn-sm(@click="onCryptoAssetDelete(cryptoAsset, index)")
                                    i.fas.fa-times
                                button.btn.btn-sm(:disabled="index === 0" @click="onCryptoAssetMoveUp(cryptoAsset, index)")
                                    i.fas.fa-arrow-up
                                button.btn.btn-sm(:disabled="index === cryptoAssets.length - 1" @click="onCryptoAssetMoveDown(cryptoAsset, index)")
                                    i.fas.fa-arrow-down
                            th {{ cryptoAsset.symbol }}
                            td.text-end
                                crypto-asset-price(:cryptoAsset="cryptoAsset" @updated="onCryptoAssetPriceUpdated(cryptoAsset, index, $event)")
                            td.text-end
                                formatted-number-input(v-model="cryptoAsset.amount" :fractionDigits="-1" :inputClass="'cell-control text-end'" :protected="protected")
                            td.text-end
                                formatted-number(:value="cryptoAsset.price * cryptoAsset.amount" :protected="protected")
                            td.text-end
                                formatted-number(:value="cryptoAsset.price * cryptoAsset.amount / current * 100")
    .card(v-if="cryptoAssets.length")
        .card-body
            canvas#chart
</template>

<script>
import CryptoAssetForm from './CryptoAssetForm'
import CryptoAssetPrice from './CryptoAssetPrice'
import FormattedNumber from './FormattedNumber'
import FormattedNumberInput from './FormattedNumberInput'
import {
    Chart,
    ArcElement,
    LineElement,
    BarElement,
    PointElement,
    BarController,
    BubbleController,
    DoughnutController,
    LineController,
    PieController,
    PolarAreaController,
    RadarController,
    ScatterController,
    CategoryScale,
    LinearScale,
    LogarithmicScale,
    RadialLinearScale,
    TimeScale,
    TimeSeriesScale,
    Decimation,
    Filler,
    Legend,
    Title,
    Tooltip,
    SubTitle,
} from 'chart.js'
import {markRaw} from 'vue'

Chart.register(
    ArcElement,
    LineElement,
    BarElement,
    PointElement,
    BarController,
    BubbleController,
    DoughnutController,
    LineController,
    PieController,
    PolarAreaController,
    RadarController,
    ScatterController,
    CategoryScale,
    LinearScale,
    LogarithmicScale,
    RadialLinearScale,
    TimeScale,
    TimeSeriesScale,
    Decimation,
    Filler,
    Legend,
    Title,
    Tooltip,
    SubTitle,
)

const PROTECTED_STORAGE_KEY = 'protected'
const CRYPTO_ASSETS_STORAGE_KEY = 'crypto_assets'

export default {
    name: 'Home',
    components: {CryptoAssetForm, CryptoAssetPrice, FormattedNumber, FormattedNumberInput},
    data() {
        return {
            createEnabled: false,

            protected: true,
            unprotectedProfit: !!this.$route.query.unprotected_profit,

            sortCurrent: 0,

            initial: 0,
            cryptoAssets: [],

            chart: null,
            chartColors: {},
            chartDrawTimeout: null,
            chartInitialized: 0,
        }
    },
    computed: {
        profit() {
            return this.current - this.initial
        },
        current() {
            if (this.cryptoAssets.length <= 0) {
                return this.initial
            }
            let current = 0
            this.cryptoAssets.forEach(cryptoAsset => {
                current += cryptoAsset.price * cryptoAsset.amount
            })
            return current
        },
    },
    watch: {
        initial() {
            this.storeData()
        },
    },
    mounted() {
        this.init()
    },
    methods: {
        init() {
            this.restoreProtected()
            this.restoreData()
        },
        drawChartNext() {
            if (this.chartDrawTimeout) {
                clearTimeout(this.chartDrawTimeout)
            }
            this.drawChart()
            this.chartDrawTimeout = setTimeout(() => this.drawChartNext(), 15000)
        },
        drawChart() {
            const labels = [], data = [], backgroundColors = []
            this.cryptoAssets.forEach(cryptoAsset => {
                labels.push(cryptoAsset.symbol)
                data.push(cryptoAsset.price * cryptoAsset.amount)
                const color = cryptoAsset.symbol in this.chartColors ?
                    this.chartColors[cryptoAsset.symbol]
                    : 'rgb(' + Math.floor(Math.random() * 256) + ', ' + Math.floor(Math.random() * 256) + ', ' + Math.floor(Math.random() * 256) + ')'
                this.chartColors[cryptoAsset.symbol] = color
                backgroundColors.push(color)
            })

            if (this.chart) {
                this.chart.data.labels = labels
                this.chart.data.datasets = [
                    {
                        label: 'Crypto assets',
                        data: data,
                        backgroundColor: backgroundColors,
                    },
                ]
                this.chart.update()
            }
            else {
                this.chart = markRaw(
                    new Chart('chart', {
                        type: 'doughnut',
                        data: {
                            labels: labels,
                            datasets: [
                                {
                                    label: 'Crypto assets',
                                    data: data,
                                    backgroundColor: backgroundColors,
                                },
                            ],
                        },
                        options: {
                            radius: '72%',
                            plugins: {
                                legend: {
                                    position: 'left',
                                },
                            },
                            onResize(chart, size) {
                                if (size.width < 576) {
                                    if (chart.options.plugins.legend.position === 'left') {
                                        chart.options.plugins.legend.position = 'top'
                                        chart.update()
                                    }
                                }
                                else {
                                    if (chart.options.plugins.legend.position === 'top') {
                                        chart.options.plugins.legend.position = 'left'
                                        chart.update()
                                    }
                                }
                            },
                        },
                    }),
                )
            }
        },
        storeProtected() {
            window.localStorage.setItem(PROTECTED_STORAGE_KEY, this.protected ? '1' : '0')
        },
        restoreProtected() {
            this.protected = window.localStorage.getItem(PROTECTED_STORAGE_KEY) !== '0'
        },
        stickData() {
            return {
                initial: this.initial,
                cryptoAssets: this.cryptoAssets.map(cryptoAsset => {
                    return {
                        symbol: cryptoAsset.symbol,
                        amount: cryptoAsset.amount,
                    }
                }),
            }
        },
        stickJsonData() {
            return JSON.stringify(this.stickData())
        },
        unstickData(stickData) {
            if ('initial' in stickData) {
                this.initial = stickData.initial
            }
            if ('cryptoAssets' in stickData) {
                this.cryptoAssets = []
                this.$nextTick(
                    () => {
                        stickData.cryptoAssets.forEach(storedCrypto => {
                            this.cryptoAssetAdd(storedCrypto.symbol, storedCrypto.amount)
                        })
                        this.onCryptoAssetsReset()
                    },
                )
            }
        },
        unstickJsonData(stickJsonData) {
            let stickData = {}
            if (stickJsonData) {
                try {
                    stickData = JSON.parse(stickJsonData)
                }
                catch (e) {
                    console.log('Restore data failed')
                    console.log(e)
                }
            }
            this.unstickData(stickData)
        },
        storeData() {
            window.localStorage.setItem(CRYPTO_ASSETS_STORAGE_KEY, this.stickJsonData())
        },
        restoreData() {
            this.unstickJsonData(window.localStorage.getItem(CRYPTO_ASSETS_STORAGE_KEY))
        },
        cryptoAssetAdd(symbol, amount = 0) {
            this.cryptoAssets.push({
                symbol: symbol,
                price: 0,
                amount: amount,
            })
        },
        onCryptoAssetFormSubmit($event) {
            this.cryptoAssetAdd($event.cryptoAsset.symbol, $event.cryptoAsset.amount)
            this.onCryptoAssetsUpdate()
            this.createEnabled = false
        },
        onProtectionClicked() {
            this.protected = !this.protected
            this.storeProtected()
        },
        onExportClicked() {
            const filename = 'crypto-holder.json'
            const file = new Blob([this.stickJsonData()], {type: 'application/json;charset=utf-8'})
            if (window.navigator.msSaveOrOpenBlob) { // IE10+
                window.navigator.msSaveOrOpenBlob(file, filename)
            }
            else { // Others
                const a = document.createElement('a'),
                    url = URL.createObjectURL(file)
                a.href = url
                a.download = filename
                document.body.appendChild(a)
                a.click()
                setTimeout(function () {
                    document.body.removeChild(a)
                    window.URL.revokeObjectURL(url)
                }, 0)
            }
        },
        onImportClicked() {
            let input = document.getElementById('inputFileImport')
            if (!input) {
                input = document.createElement('input')
                input.id = 'inputFileImport'
                input.type = 'file'
                input.style.display = 'none'
                input.onchange = e => {
                    if (e.target.files.length) {
                        const file = e.target.files[0]
                        if (file.type === 'application/json') {
                            const reader = new FileReader()
                            reader.addEventListener('load', e => {
                                this.unstickJsonData(atob(e.target.result.substr('data:application/json;base64,'.length)))
                            })
                            reader.readAsDataURL(file)
                        }
                    }
                    input.value = ''
                }
                document.body.appendChild(input)
            }
            input.click()
        },
        onProfitClicked() {
            this.unprotectedProfit = !this.unprotectedProfit
        },
        onCurrentSortClick() {
            this.sortCurrent = (this.sortCurrent + 1) % 3
            switch (this.sortCurrent) {
                case 1:
                    this.cryptoAssets = this.cryptoAssets.sort((cryptoAsset1, cryptoAssets2) => {
                        return cryptoAsset1.price * cryptoAsset1.amount - cryptoAssets2.price * cryptoAssets2.amount
                    })
                    break
                case 2:
                    this.cryptoAssets = this.cryptoAssets.sort((cryptoAsset1, cryptoAssets2) => {
                        return cryptoAssets2.price * cryptoAssets2.amount - cryptoAsset1.price * cryptoAsset1.amount
                    })
                    break
                default:
                    this.cryptoAssets = this.cryptoAssets.sort((cryptoAsset1, cryptoAssets2) => {
                        return cryptoAsset1.symbol < cryptoAssets2.symbol ?
                            -1 : (cryptoAsset1.symbol > cryptoAssets2.symbol ? 1 : 0)
                    })
                    break
            }
            this.onCryptoAssetsUpdate()
        },
        onCryptoAssetDelete(cryptoAsset, index) {
            this.cryptoAssets.splice(index, 1)
            this.onCryptoAssetsUpdate()
        },
        onCryptoAssetMoveUp(cryptoAsset, index) {
            this.cryptoAssets.splice(index - 1, 0, this.cryptoAssets.splice(index, 1)[0])
            this.sortCurrent = 0
            this.onCryptoAssetsUpdate()
        },
        onCryptoAssetMoveDown(cryptoAsset, index) {
            this.cryptoAssets.splice(index + 1, 0, this.cryptoAssets.splice(index, 1)[0])
            this.sortCurrent = 0
            this.onCryptoAssetsUpdate()
        },
        onCryptoAssetPriceUpdated(cryptoAsset, index, $event) {
            cryptoAsset.price = $event.price
            this.$forceUpdate()
            this.onCryptoAssetsUpdate(++this.chartInitialized === this.cryptoAssets.length)
        },
        onCryptoAssetsUpdate(redrawChart = true) {
            this.$nextTick(() => {
                this.storeData()
                if (redrawChart) {
                    this.drawChartNext()
                }
            })
        },
        onCryptoAssetsReset() {
            this.chartInitialized = 0
        },
    },
}
</script>

<style lang="scss" scoped>
.card {
    margin-top: 1.5rem;

    &:last-child {
        margin-bottom: 1.5rem;
    }
}

.table {
    th {
        white-space: nowrap !important;
    }
}

.cell-control {
    width: 100%;
    height: 100%;
    border: none;
    outline: 0;
}

.column-numeric {
    width: 180px;
}
</style>