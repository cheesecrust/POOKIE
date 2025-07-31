package com.ssafy.pookie.game.draw.dto;

import lombok.Data;

@Data
public class DrawData {
    private int x, y, prevX, prevY;
    private String color;
    private int brushSize;
    private String tool;
}
