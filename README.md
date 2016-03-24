# Javascript Application

本アプリケーションは「[政府統計の総合窓口(e-stat) API 機能](http://www.e-stat.go.jp/api/)」(以下、e-Stat API)から公開されているデータを取得し、Webブラウザ上で可視化を行います。
データの描画方法は、「棒グラフ」、「折れ線グラフ」、「散布図」、「地図」の4種類から選択できます。
また、ご自身が保有するデータを読み込み、e-Stat APIから取得したデータと組み合わせた分析を行えます。
なお、本アプリケーションは、HTML、CSS、Javascriptのみで構成されており、e-Stat APIのデータのみを使う場合はサーバーを用意する必要はありません。
ただし、データはe-Stat APIを経由して取得するため、インターネットへの接続は必要です。
また、Javascriptのライブラリはデータの描画として「jQuery」と「D3」、地図の描画に関しては「leaflet」の3つを使用しています。
ソースコードを改良することで、他の手法によるデータの可視化等に対応することができます。

## 対応ブラウザ

以下のブラウザの最新版(2016/03/24時点)で動作確認をしています。

* Google Chrome
* Apple Safari
* Mozilla Firefox
* Microsoft Internet Explorer 11
* Microsoft Edge


## 最初に行うこと
appIdの取得と設定
まず、e-StatAPIのサイト(http://www.e-stat.go.jp/api/)に行き、appIdを取得してください。
appIdがないと、本アプリケーションは動作しませんので、必ず取得してください。
取得したappIdをプロンプトに入力し、本アプリケーション内に保存します。

## 動作確認

index.htmlをブラウザで開いてください。
なお、ローカル上でInternet Explorer11でお使いの場合は、一部の機能が使用できません。
この場合は、Webサーバーを通して扱うことで全ての機能がお使いいただけます。


## 機能紹介

本ソフトウェアは統計データの読込とデータの描画を行うことができます。

* 統計データ読込
* 自己データ読込
* データの描画

### 統計データ読込
e-Stat APIのデータを読み込むためには、それぞれのデータに割り当てられている統計IDが必要です。 
アプリケーション左上の「データの追加等」をクリックし、表示されるテキストボックスに統計IDを入力し、ロードボタンをクリックしてください。

### データの描画
本アプリケーション内では、「棒グラフ」、「折れ線グラフ」、「散布図」、「地図」の描画方法が選択できます。

### 自己データ読込
下記の形式のJSONファイルを読込、統計データとの散布図等を描画することができます。

    {
    	"METADATA":#e-STAT APIから取得できるメタデータのJSON形式と同じ#
    	,"STATDATA":#e-STAT APIから取得できる統計データのJSON形式と同じ#
    }

アプリケーション左上の「データの追加等」をクリックし、表示されるファイル選択ボックスから作成したJSONファイルを指定してください。
ロードボタンをクリックすると、データが読み込まれます。
なお、ローカル上でInternet Explorer11でお使いの場合は、この機能が使用できません。

# License

The MIT License (MIT)
Copyright (c) 2016 National Statistics Center

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

        
        
				
