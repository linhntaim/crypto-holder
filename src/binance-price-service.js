import axios from 'axios'

export class BinancePriceService {
    constructor() {
        this.cachePaired = {}
    }

    getPriceBySymbol(symbol, doneCallback = null, errorCallback = null) {
        const done = (response, pair) => doneCallback && doneCallback(parseFloat(response.data.c), 'https://www.binance.com/en/trade/' + symbol + '_' + pair)
        if (symbol in this.cachePaired) {
            const pair = this.cachePaired[symbol]
            this.getProductByPairedSymbol(
                symbol + pair,
                response => done(response, pair),
                errorCallback,
            )
        }
        else {
            const pairs = ['USDT', 'BUSD']
            const sync = (index = 0) => {
                const pair = pairs[index]
                const pairedSymbol = symbol + pair
                const next = response => {
                    console.log('Failed: ' + pairedSymbol)
                    console.log(response)
                    const nextIndex = index + 1
                    if (nextIndex < pairs.length) {
                        sync(nextIndex)
                    }
                    else {
                        errorCallback && errorCallback(response)
                    }
                }
                this.getProductByPairedSymbol(
                    pairedSymbol,
                    response => {
                        if (response.data) {
                            this.cachePaired[symbol] = pairs[index]
                            done(response, pair)
                        }
                        else {
                            next(response)
                        }
                    },
                    response => {
                        next(response)
                    },
                )
            }
            sync()
        }
    }

    getProductByPairedSymbol(pairedSymbol, doneCallback = null, errorCallback = null) {
        axios.get('https://www.binance.com/bapi/asset/v2/public/asset-service/product/get-product-by-symbol?symbol=' + pairedSymbol)
            .then(response => {
                if (response.data) {
                    doneCallback && doneCallback(response.data)
                }
                else {
                    errorCallback && errorCallback(response)
                }
            })
            .catch(response => {
                errorCallback && errorCallback(response)
            })
    }
}