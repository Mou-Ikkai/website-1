import preact from 'preact';
import { IntlProvider, Text } from 'preact-i18n';
import t from 'Utility/i18n';
import FlashMessage, { flash } from 'Components/FlashMessage';
import StarWidget from 'Components/StarWidget';
import { rethrow } from '../Utility/errors';

const API_URL = 'https://comments.datenanfragen.de';
const TARGET = LOCALE + '/' + document.location.pathname.replace(/^\s*\/*\s*|\s*\/*\s*$/gm, '');

export default class CommentsWidget extends preact.Component {
    constructor(props) {
        super(props);

        this.state.comments = [];

        fetch(API_URL + '/get/' + TARGET)
            .then(function(res) {
                return res.json();
            })
            .then(comments => {
                this.setState({ comments: comments.sort((a, b) => -a.added_at.localeCompare(b.added_at)) });
            });
    }

    render() {
        let comment_elements = [];

        this.state.comments.forEach(c => {
            comment_elements.push(
                <Comment id={c.id} author={c.author} message={c.message} date={c.added_at} additional={c.additional} />
            );
        });

        return (
            <IntlProvider scope="comments" definition={I18N_DEFINITION}>
                <div id="comments-widget">
                    <h2>
                        <Text id="comments" />
                    </h2>
                    {!comment_elements || comment_elements.length === 0 ? (
                        <p>
                            <Text id="no-comments" />
                        </p>
                    ) : (
                        comment_elements
                    )}
                    <CommentForm allow_rating={this.props.allow_rating} />
                </div>
            </IntlProvider>
        );
    }
}

export class Comment extends preact.Component {
    render() {
        return (
            <div className="comment box box-compact" style="margin-bottom: 15px; position: relative;">
                <span>
                    <strong>{this.props.author}</strong> ({new Date(this.props.date).toLocaleString()})
                </span>
                {this.props.additional.rating ? (
                    <div style="position: absolute; top: 0; right: 0; margin: 5px 5px 0 0;">
                        <StarWidget
                            id={'stars-' + this.props.id}
                            initial={this.props.additional.rating}
                            readonly={true}
                        />
                    </div>
                ) : (
                    []
                )}
                <p>
                    {this.props.message.split('\n').map((item, key) => {
                        return (
                            <span key={key}>
                                {item}
                                <br />
                            </span>
                        );
                    })}
                </p>
            </div>
        );
    }
}

export class CommentForm extends preact.Component {
    constructor(props) {
        super(props);

        this.state = {
            author: '',
            message: '',
            rating: 0
        };

        this.submitComment = this.submitComment.bind(this);
    }

    render() {
        return (
            <form id="comment-form">
                <h3 style="margin-bottom: 15px;">
                    <Text id="leave-comment" />
                </h3>

                <div className="col25 col100-mobile">
                    <strong>
                        <Text id="author" />
                    </strong>{' '}
                    <Text id="optional" />
                </div>
                <div className="col75 col100-mobile">
                    <div className="form-group form-group-vertical">
                        <label for="new-comment-author" className="sr-only">
                            <Text id="author" />
                        </label>
                        <input
                            type="text"
                            id="new-comment-author"
                            className="form-element"
                            placeholder={t('author', 'comments')}
                            value={this.state.author}
                            onChange={e => this.setState({ author: e.target.value })}
                        />
                    </div>
                </div>
                <div className="clearfix" />

                <div className="col25 col100-mobile">
                    <strong>
                        <Text id="comment" />
                    </strong>
                </div>
                <div className="col75 col100-mobile">
                    <div className="form-group form-group-vertical">
                        <label for="new-comment-message" className="sr-only">
                            <Text id="comment" />
                        </label>
                        <textarea
                            id="new-comment-message"
                            className="form-element"
                            rows={4}
                            placeholder={t('comment', 'comments')}
                            required={true}
                            value={this.state.message}
                            onChange={e => this.setState({ message: e.target.value })}
                        />
                    </div>
                </div>
                <div className="clearfix" />

                {this.props.allow_rating
                    ? [
                          <div className="col25 col100-mobile">
                              <strong>
                                  <Text id="rating" />
                              </strong>{' '}
                              <Text id="optional" />
                          </div>,
                          <div className="col75 col100-mobile">
                              <div className="form-group form-group-vertical">
                                  <label for="star-widget" className="sr-only">
                                      <Text id="rating" />
                                  </label>
                                  <StarWidget id="star-widget" onChange={rating => this.setState({ rating: rating })} />
                              </div>
                          </div>,
                          <div className="clearfix" />
                      ]
                    : []}

                <button id="submit-comment" onClick={this.submitComment} style="float: right;">
                    <Text id="submit" />
                </button>
                <div className="clearfix" />
            </form>
        );
    }

    submitComment(e) {
        e.preventDefault();

        if (!this.state.message) {
            flash(<FlashMessage type="error">{t('error-no-message', 'comments')}</FlashMessage>);
            return false;
        }

        let body = {
            author: this.state.author,
            message: this.state.message,
            target: TARGET
        };
        if (this.props.allow_rating && this.state.rating) body['additional'] = { rating: this.state.rating };

        fetch(API_URL, {
            method: 'put',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(response => {
                if (!response.ok) throw new Error('Unexpected response from comments server.');

                flash(<FlashMessage type="success">{t('send-success', 'comments')}</FlashMessage>);
                this.setState({ message: '' });
            })
            .catch(err => {
                rethrow(err);
                flash(<FlashMessage type="error">{t('send-error', 'comments')}</FlashMessage>);
            });
    }
}
