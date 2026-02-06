import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Left } from "../../icons";

interface PaginationProps {
  page?: number;
  name: string;
  onChange?: (name: string, page: number) => void;
  total_page?: number;
}

interface PagiState {
  page: number;
  limit: number;
  total: number;
}

let first = false;
const Pagination: React.FC<PaginationProps> = ({ page, name, onChange = () => {}, total_page }) => {
  const [pagi, setPagi] = useState<PagiState>({ page: 1, limit: 20, total: 1000 });

  const totalPage = total_page;

  const onChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (totalPage && value > totalPage) {
      const temp = { ...pagi };
      temp.page = 1;
      setPagi(temp);
      return;
    }

    const temp = { ...pagi };
    temp.page = value;
    setPagi(temp);
  };
  const next = () => {
    if (totalPage && pagi.page >= totalPage) return;

    const temp = { ...pagi };
    temp.page = temp.page + 1;
    setPagi(temp);
  };
  const prev = () => {
    if (pagi.page <= 1) return;
    const temp = { ...pagi };
    temp.page = temp.page - 1;
    setPagi(temp);
  };

  const pushParent = (pagi: PagiState) => {
    if (pagi.page && first) {
      onChange(name, pagi.page);
    }
  };

  useEffect(() => {
    pushParent(pagi);
  }, [pagi.page]);

  useEffect(() => {
    if (totalPage === 1 || !totalPage) {
      const temp = { ...pagi };
      temp.page = 1;
      setPagi(temp);
      return;
    }
  }, [totalPage]);

  useEffect(() => {
    first = true;
  }, []);
  if (!totalPage || totalPage <= 1) return <div></div>;
  return (
    <Pagi>
      <div
        className={
          pagi.page === 1 || pagi.page < 1 || !pagi.page
            ? "arrow block hover"
            : "arrow hover"
        }
        onClick={prev}
      >
        <Left />
      </div>
      <div className="input">
        Page
        <input type="number" onChange={onChangeInput} value={pagi.page} />
        of &nbsp; {totalPage}
      </div>
      <div
        className={
          pagi.page >= totalPage ? "arrow next block hover" : "arrow next hover"
        }
        onClick={next}
      >
        <Left />
      </div>
    </Pagi>
  );
};

const Pagi = styled.div`
  display: flex;
  color: #fff;
  align-items: center;
  .arrow {
    margin: 0px 10px;
    padding: 0.5rem 1.688rem;
    border-radius: 0.3rem;
    border: solid 0.125rem #373c51;
    cursor: pointer;
    display: flex;
    align-items: center;
    &.block {
      cursor: not-allowed;
      svg {
        fill: #2f3346;
      }
    }
    &.next {
      svg {
        transform: rotate(-180deg);
      }
    }

    svg {
      width: 1.875rem;
      fill: white;
    }
  }

  .input {
    display: flex;
    align-items: center;
    input {
      width: 5.313rem;
      height: 2.75rem;
      margin: 0px 0.5rem;
      /* margin: 86px 13px 0 14px; */
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 0.313rem;
      border: solid 0.125rem #373c51;
      background-color: #191b24;
      transition: box-shadow 0.3s ease-in-out;
      text-align: center;
      &:focus {
        box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px,
          rgb(51, 51, 51) 0px 0px 0px 3px;
        outline: none;
      }
    }
  }
`;

export default Pagination;
