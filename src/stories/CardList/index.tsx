/* eslint-disable react/no-array-index-key */
import React from 'react';
import {styled} from 'storybook/theming';
import fish1 from './assets/fish-1.jpg';
import fish2 from './assets/fish-2.jpg';
import fish3 from './assets/fish-3.jpg';
import fish4 from './assets/fish-4.jpg';
import fish5 from './assets/fish-5.jpg';
import './index.css';

const StyledList = styled.ul`
    min-height: 100vh;
    margin-top: 4rem;
    list-style-type: none;
    display: grid;
    grid-auto-flow: column;
    scroll-snap-type: x mandatory;
    scroll-padding: 0 1rem 0 1rem;
    padding: 1rem;
    grid-gap: 1rem;
    overflow-x: auto;
    &::after {
        content: '';
        width: 1rem;
    }
    &::-webkit-scrollbar {
        display: none;
    }

    > a {
        transition: transform 0.25s;
        display: inline-block;
        scroll-snap-align: start;
        height: 8rem;
        width: 8rem;
        border-radius: 6px;
        overflow: hidden;
    }

    > a:active {
        transform: scale(0.975);
    }

    li {
        img {
            width: 100%;
            object-fit: cover;
        }
    }
    @media (min-width: 768px) {
        grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
        max-width: 800px;
        grid-auto-flow: row;
    }
`;

const cards = [
    fish1,
    fish2,
    fish3,
    fish4,
    fish5,
    fish1,
    fish2,
    fish3,
    fish4,
    fish5,
];

const CardList = () => (
    <StyledList>
        {cards.map((source, index) => (
            <a
                key={index}
                href="/"
                onClick={(event) => {
                    event.preventDefault();
                }}
            >
                <li>
                    <img alt="fish" src={source} />
                </li>
            </a>
        ))}
    </StyledList>
);

export default CardList;
