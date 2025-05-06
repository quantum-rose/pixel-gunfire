import { ApiMsgEnum } from '@pixel-gunfire/common';
import { _decorator, Component, director, EditBox, Label, sys } from 'cc';
import { SceneEnum } from '../Enum';
import { DataManager, NetworkManager } from '../Global';
const { ccclass, property } = _decorator;

const LOCAL_STORAGE_KEY = 'nickname';

@ccclass('LoginManager')
export class LoginManager extends Component {
    private _input: EditBox;

    private _errorMessage: Label;

    protected onLoad(): void {
        this._input = this.node.getChildByName('Input').getComponent(EditBox);
        this._errorMessage = this.node.getChildByName('ErrorMessage').getComponent(Label);
        this._errorMessage.string = '';

        const savedNickname = sys.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedNickname) {
            this._input.string = savedNickname;
        }

        director.preloadScene(SceneEnum.Hall);
        director.preloadScene(SceneEnum.Room);
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
            sys.localStorage.setItem(LOCAL_STORAGE_KEY, nickname);

            this._errorMessage.string = '';
            DataManager.Instance.playerInfo = res.player;

            director.loadScene(SceneEnum.Hall);
        } else {
            this._errorMessage.string = error;
        }
    }
}
