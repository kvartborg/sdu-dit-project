import React, {Component} from "react";
import postServices from "../../../services/postServices";
import PostCard from "../../Cards/PostCard";
import "./postView.css";
import CommentCard from "../../Cards/CommentCard";
import TextField from "@material-ui/core/TextField";
import { Button } from "@material-ui/core/";
import Client from '@upsub/client';

const client = new Client('ws://localhost:4400')

export default class PostView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      comments: [],
      post: null,
      isLoading: true,
      author: "",
      comment: ""
    };
  }

  UNSAFE_componentWillMount() {
    this.fetchPost();
  }

  componentWillUnmount() {
    client.off(`${this.state.post._id}/new/comment`)
  }

  fetchPost = async () => {
    let res = await postServices.getPost(this.props.match.params.id);
    this.setState({
      post: res,
      comments: res.comments,
    });
    client.on(`${res._id}/new/comment`, comment => this.setState({
      comments: [...this.state.comments, comment],
    }))
  };

  onAuthorInput = event => {
    this.setState({ author: event.target.value });
  };
  onPostInput = event => {
    this.setState({ comment: event.target.value });
  };

  onCreateComment = async () => {
    if (this.state.author.length < 1 || this.state.comment.length < 1) {
      return console.log("error msg");
    }

    let comment = {
      author: this.state.author,
      comment: this.state.comment,
      date: new Date().toDateString(),
      vote: 0
    };

    client.send(`${this.state.post._id}/new/comment`, comment)
    this.setState({
      author: "",
      comment: "",
      comments: [...this.state.comments, comment]
    });

    const post = await postServices.getPost(this.props.match.params.id)

    // the next two lines are a hack, could be handled a lot smarter and more performant
    // if there where time to address it...
    post.comments.push(comment)
    await postServices.updatePost(this.props.match.params.id, post)
  };

  renderCommentList = () => {
    if (this.state.comments.length > 0) {
      return (
        <div>
          <div className="commentContainer">
            {this.state.comments.map(c => {
              return (
                <div key={c._id}>
                  <CommentCard
                    key={c.id}
                    id={c._id}
                    votes={c.vote}
                    date={c.date}
                    author={c.author}
                    comment={c.comment}
                    post={this.state.post}
                  ></CommentCard>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  renderPost = () => {
    if (this.state.post) {
      return (
        <PostCard
          date={this.state.post.date}
          id={this.state.post._id}
          author={this.state.post.author}
          content={this.state.post.content}
        ></PostCard>
      );
    } else {
      return <div></div>;
    }
  };

  render() {
    return (
      <div className="postViewContainer">
        {this.renderPost()}
        <div className="commentsSectionTitle">
          <div className="commentFlexBox">
            <div className="commentInput">
              <TextField
                className="contentInput"
                label="Author"
                onChange={event => this.onAuthorInput(event)}
                value={this.state.author}
              ></TextField>
            </div>
            <div className="commentInput">
              <TextField
                className="contentInput"
                multiline
                onChange={event => this.onPostInput(event)}
                label="Comment"
                value={this.state.comment}
              ></TextField>
            </div>
            <Button onClick={this.onCreateComment} variant="contained">
              Comment
            </Button>
          </div>
          Comments
          {this.renderCommentList()}
        </div>
      </div>
    );
  }
}
