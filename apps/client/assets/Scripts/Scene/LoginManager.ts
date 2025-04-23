import { _decorator, Component, director, EditBox, Label } from 'cc';
import { ApiMsgEnum } from '../Common';
import { SceneEnum } from '../Enum';
import DataManager from '../Global/DataManager';
import { NetworkManager } from '../Global/NetworkManager';
const { ccclass, property } = _decorator;

@ccclass('LoginManager')
export class LoginManager extends Component {
    private _input: EditBox;

    private _errorMessage: Label;

    protected onLoad(): void {
        this._input = this.node.getChildByName('Input').getComponent(EditBox);
        this._errorMessage = this.node.getChildByName('ErrorMessage').getComponent(Label);
        this._errorMessage.string = '';

        director.preloadScene(SceneEnum.Hall);
        director.preloadScene(SceneEnum.Battle);

        NetworkManager.Instance.connect();
    }

    public async handleClickLogin() {
        const nickname = this._input.string;
        if (!nickname) {
            this._errorMessage.string = '昵称不能为空';
            return;
        }

        if (!NetworkManager.Instance.isConnected) {
            NetworkManager.Instance.connect();
            return;
        }

        const { success, res, error } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiPlayerJoin, { nickname });

        if (success) {
            this._errorMessage.string = '';
            DataManager.Instance.myPlayerId = res.player.id;
            DataManager.Instance.myNickname = res.player.nickname;

            director.loadScene(SceneEnum.Hall);
        } else {
            this._errorMessage.string = error;
        }
    }
}
