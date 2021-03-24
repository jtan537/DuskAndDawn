using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MoveUpDown : MonoBehaviour
{
    private bool move;
    private GameObject floor;
    private GameObject top;
    private int speed = 10;

    // Start is called before the first frame update
    void Start()
    {
        move = true;
        floor = gameObject.transform.parent.gameObject.transform.GetChild(1).gameObject;
        top = gameObject.transform.parent.gameObject.transform.GetChild(2).gameObject;
    }

    // Update is called once per frame
    void Update()
    {
        if (move == true){
            transform.Translate(Vector2.left * speed * Time.deltaTime);
        }
        else if (move == false){
            transform.Translate(Vector2.right * speed * Time.deltaTime);
        }
        // print(Vector3.Distance(gameObject.transform.position, top.transform.position));
        if (Vector3.Distance(gameObject.transform.position, floor.transform.position) < 5){
            move = true;
        }
        else if (Vector3.Distance(gameObject.transform.position, top.transform.position) < 5){
            move = false;
        }
    }
}
