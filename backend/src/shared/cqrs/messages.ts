export interface ICommand {}
export interface IQuery<TResult = any> {
  _result?: TResult;
}
