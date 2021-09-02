import axios from 'axios'

export class BinancePriceService {
    constructor() {
        this.cachePaired = {}
    }

    getPriceBySymbol(symbol, doneCallback = null, errorCallback = null) {
        if (symbol in this.cachePaired) {
            this.getProductByPairedSymbol(
                symbol + this.cachePaired[symbol],
                response => doneCallback && doneCallback(parseFloat(response.data.c)),
                errorCallback,
            )
        }
        else {
            const pairs = ['USDT', 'BUSD']
            const sync = (index = 0) => {
                const next = response => {
                    console.log('Failed: ' + symbol + pairs[index])
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
                    symbol + pairs[index],
                    response => {
                        if (response.data) {
                            this.cachePaired[symbol] = pairs[index]
                            doneCallback && doneCallback(parseFloat(response.data.c))
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