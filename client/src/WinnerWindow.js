import React, {Component} from "react";
import { Button, Modal } from 'react-bootstrap'

import '../node_modules/react-combo-select/style.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

class WinnerWindow extends Component{

    constructor(props){
        super(props);
        this.state = {
            winning : this.props.winner,
            showHide : this.props.winner.showWinner
        }
    }

    handleModalShowHide() {
        this.setState({ showHide: ! this.state.showHide })
        this.props.winner.showWinner = false;
    }

    render() {
        const { winning, showWinner } = this.props.winner;
        console.log('Show Winner Windows :'+showWinner);

        return (
        <div>
            <Modal show={this.props.winner.showWinner} > 
            <Modal.Header>
                <Modal.Title>Winning Proposal</Modal.Title>
            </Modal.Header>
            <Modal.Body>{winning.index} - {winning.description} -&gt; ({winning.voteCount}) </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => this.handleModalShowHide()}>
                    Close
                </Button>
            </Modal.Footer>
            </Modal>
        </div>
        );
    }
}
export default WinnerWindow;